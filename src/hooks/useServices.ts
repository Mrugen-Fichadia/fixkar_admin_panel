import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ServiceSubCategory {
  id?: string;
  name: string;
  status: 'Active' | 'Inactive';
  parentId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ServiceCategory {
  id?: string;
  name: string;
  status: 'Active' | 'Inactive';
  subCategories?: ServiceSubCategory[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const useServices = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const categoriesRef = collection(db, 'Services');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(categoriesRef);
      
      const processedCategories: ServiceCategory[] = [];
      
      querySnapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        const docId = docSnapshot.id;
        
        // Track which fields we've processed to avoid duplicates
        const processedFields = new Set<string>();
        
        // First pass: process all category fields (array fields)
        Object.keys(data).forEach(fieldName => {
          // Skip status fields in the first pass
          if (fieldName.endsWith('_status')) return;
          
          const fieldValue = data[fieldName];
          
          // Only process array fields (categories with subcategories)
          if (Array.isArray(fieldValue)) {
            processedFields.add(fieldName);
            
            // Get the status for this category (default to 'Active' if not set)
            const statusField = `${fieldName}_status`;
            const status = data[statusField] || 'Active';
            
            const category: ServiceCategory = {
              id: `${docId}_${fieldName}`,
              name: fieldName,
              status: status,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              subCategories: []
            };
            
            // Process subcategories
            category.subCategories = fieldValue.map((subName: string, index: number) => ({
              id: `${docId}_${fieldName}_${index}`,
              name: subName,
              status: 'Active', // Subcategory status is always active for now
              parentId: `${docId}_${fieldName}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
            
            processedCategories.push(category);
          }
        });
      });
      
      setCategories(processedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (categoryData: Omit<ServiceCategory, 'id' | 'subCategories'> & { parentId?: string }) => {
    try {
      const { parentId, ...rest } = categoryData;
      
      if (parentId) {
        // Adding a subcategory
        // parentId format: "docId_categoryName"
        const parts = parentId.split('_');
        if (parts.length < 2) {
          throw new Error('Invalid parent ID format');
        }
        
        const docId = parts[0];
        const categoryName = parts.slice(1).join('_');
        
        const docRef = doc(db, 'Services', docId);
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) {
          throw new Error('Document not found');
        }
        
        const docData = docSnapshot.data();
        const existingSubcategories = docData[categoryName] || [];
        
        // Check if subcategory already exists
        if (existingSubcategories.includes(rest.name.trim())) {
          throw new Error('Subcategory already exists');
        }
        
        // Add new subcategory name to the array
        await updateDoc(docRef, {
          [categoryName]: [...existingSubcategories, rest.name.trim()]
        });
        
        console.log('Subcategory added to category:', categoryName);
        await fetchCategories();
        return { success: true, id: `${docId}_${categoryName}_${existingSubcategories.length}` };
      } else {
        // Create a new document for each main category
        const docRef = await addDoc(categoriesRef, {
          [rest.name.trim()]: [],
          [`${rest.name.trim()}_status`]: 'Active' // Initialize status
        });
        
        console.log('New category document created with ID:', docRef.id);
        await fetchCategories();
        return { success: true, id: `${docRef.id}_${rest.name.trim()}` };
      }
    } catch (err) {
      console.error('Error adding category:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to add category' 
      };
    }
  };

  const updateCategory = async (id: string, updates: Partial<Omit<ServiceCategory, 'id' | 'subCategories'>>) => {
    try {
      const parts = id.split('_');
      
      if (parts.length >= 3) {
        // Subcategory update: "docId_categoryName_index"
        const docId = parts[0];
        const indexStr = parts[parts.length - 1];
        const categoryName = parts.slice(1, -1).join('_');
        const index = parseInt(indexStr, 10);
        
        if (isNaN(index)) {
          throw new Error('Invalid subcategory ID format');
        }
        
        const docRef = doc(db, 'Services', docId);
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) {
          throw new Error('Document not found');
        }
        
        const docData = docSnapshot.data();
        const subcategories = [...(docData[categoryName] || [])];
        
        if (index < 0 || index >= subcategories.length) {
          throw new Error('Subcategory not found');
        }
        
        // Update the subcategory name
        if (updates.name) {
          const newName = updates.name.trim();
          
          // Check for duplicates
          if (subcategories.includes(newName) && subcategories[index] !== newName) {
            throw new Error('Subcategory with this name already exists');
          }
          
          subcategories[index] = newName;
        }
        
        // Update the document with any changes
        const updateData: Record<string, any> = { [categoryName]: subcategories };
        
        // Handle status updates
        if (updates.status) {
          updateData[`${categoryName}_status`] = updates.status;
        }
        
        await updateDoc(docRef, updateData);
      } else if (parts.length >= 2) {
        // Category update: "docId_categoryName"
        const docId = parts[0];
        const oldCategoryName = parts.slice(1).join('_'); // Handle category names with underscores
        const docRef = doc(db, 'Services', docId);
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) {
          throw new Error('Document not found');
        }
        
        const docData = docSnapshot.data();
        
        if (updates.name && updates.name !== oldCategoryName) {
          const newCategoryName = updates.name.trim();
          
          // Check if new category name already exists
          if (newCategoryName in docData) {
            throw new Error('Category with this name already exists');
          }
          
          const subcategories = docData[oldCategoryName] || [];
          
          // Create new field with new name and delete old field
          await updateDoc(docRef, {
            [newCategoryName]: subcategories,
            [oldCategoryName]: deleteField(),
            // Transfer status to new field name if it exists
            [`${newCategoryName}_status`]: docData[`${oldCategoryName}_status`] || 'Active'
          });
          
          // Remove old status field
          await updateDoc(docRef, {
            [`${oldCategoryName}_status`]: deleteField()
          });
        } else if (updates.status) {
          // Only update status if no name change
          const statusField = `${oldCategoryName}_status`;
          await updateDoc(docRef, {
            [statusField]: updates.status
          });
        }
      }
      
      await fetchCategories();
      return { success: true };
    } catch (err) {
      console.error('Error updating category:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update category' 
      };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const parts = id.split('_');
      
      if (parts.length >= 3) {
        // Delete subcategory: "docId_categoryName_index"
        const docId = parts[0];
        const indexStr = parts[parts.length - 1];
        const categoryName = parts.slice(1, -1).join('_');
        const index = parseInt(indexStr, 10);
        
        if (isNaN(index)) {
          throw new Error('Invalid subcategory ID format');
        }
        
        const docRef = doc(db, 'Services', docId);
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) {
          throw new Error('Document not found');
        }
        
        const docData = docSnapshot.data();
        const subcategories = [...(docData[categoryName] || [])];
        
        if (index < 0 || index >= subcategories.length) {
          throw new Error('Subcategory not found');
        }
        
        // Remove the subcategory
        subcategories.splice(index, 1);
        
        await updateDoc(docRef, {
          [categoryName]: subcategories
        });
      } else if (parts.length >= 2) {
        // Delete category: "docId_categoryName"
        const docId = parts[0];
        const categoryName = parts.slice(1).join('_');
        
        const docRef = doc(db, 'Services', docId);
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) {
          throw new Error('Document not found');
        }
        
        const docData = docSnapshot.data();
        const subcategories = docData[categoryName] || [];
        
        if (subcategories.length > 0) {
          throw new Error('Cannot delete a category that has subcategories. Please delete all subcategories first.');
        }
        
        // Delete the field from the document
        await updateDoc(docRef, {
          [categoryName]: deleteField()
        });
      }
      
      await fetchCategories();
      return { success: true };
    } catch (err) {
      console.error('Error deleting category:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete category' 
      };
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        await fetchCategories();
      } catch (error) {
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
          setError(errorMessage);
          console.error('Error in useEffect:', error);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: fetchCategories
  };
};
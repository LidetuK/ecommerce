/**
 * Category Controller
 * Handles all category-related operations
 */

const pool = require('../config/db');
const logger = require('../utils/logger');

// Mock category data for development
const categories = [
  {
    id: "1",
    name: "Clothing",
    description: "Baby clothes for all ages",
    slug: "clothing",
    image: "/images/categories/clothing.jpg",
  },
  {
    id: "2",
    name: "Furniture",
    description: "Cribs, changing tables, and more",
    slug: "furniture",
    image: "/images/categories/furniture.jpg",
  },
  {
    id: "3",
    name: "Feeding",
    description: "Bottles, bibs, and feeding accessories",
    slug: "feeding",
    image: "/images/categories/feeding.jpg",
  },
  {
    id: "4",
    name: "Toys",
    description: "Educational and fun toys for babies and toddlers",
    slug: "toys",
    image: "/images/categories/toys.jpg",
  },
  {
    id: "5",
    name: "Strollers",
    description: "Strollers and travel systems",
    slug: "strollers",
    image: "/images/categories/strollers.jpg",
  },
];

// Mock product data (simplified version)
const products = [
  {
    id: "1",
    name: "Baby Onesie",
    description: "Soft cotton onesie for newborns",
    price: 19.99,
    category_id: "1",
    category_name: "Clothing",
    featured: true,
  },
  {
    id: "2",
    name: "Baby Crib",
    description: "Convertible 4-in-1 crib",
    price: 299.99,
    category_id: "2",
    category_name: "Furniture",
    featured: true,
  },
  {
    id: "3",
    name: "Baby Bottles Set",
    description: "Set of 3 anti-colic baby bottles",
    price: 24.99,
    category_id: "3",
    category_name: "Feeding",
    featured: false,
  },
];

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get a category by slug
 * @route   GET /api/categories/:slug
 * @access  Public
 */
const getCategoryBySlug = async (req, res) => {
  try {
    const category = categories.find(c => c.slug === req.params.slug);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get products by category
 * @route   GET /api/categories/:slug/products
 * @access  Public
 */
const getProductsByCategory = async (req, res) => {
  try {
    const category = categories.find(c => c.slug === req.params.slug);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const categoryProducts = products.filter(p => p.category_id === category.id);
    
    res.json({
      category,
      products: categoryProducts,
      count: categoryProducts.length,
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    // Check if category exists
    const categoryExists = categories.find(c => c.slug === slug);
    
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    // Process uploaded image (in a real app, you'd save this to storage)
    const image = req.file 
      ? `/images/categories/${req.file.originalname}` 
      : '/images/categories/default.jpg';
    
    // Create new category
    const newCategory = {
      id: Date.now().toString(),
      name,
      description,
      slug,
      image,
    };
    
    // In a real app, you'd save to database
    categories.push(newCategory);
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res) => {
  try {
    const categoryIndex = categories.findIndex(c => c.id === req.params.id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const { name, description } = req.body;
    
    // Generate new slug if name is provided
    const slug = name 
      ? name.toLowerCase().replace(/\s+/g, '-') 
      : categories[categoryIndex].slug;
    
    // Process uploaded image
    const image = req.file 
      ? `/images/categories/${req.file.originalname}` 
      : categories[categoryIndex].image;
    
    // Update the category
    const updatedCategory = {
      ...categories[categoryIndex],
      name: name || categories[categoryIndex].name,
      description: description || categories[categoryIndex].description,
      slug,
      image,
    };
    
    // In a real app, you'd update in database
    categories[categoryIndex] = updatedCategory;
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res) => {
  try {
    const categoryIndex = categories.findIndex(c => c.id === req.params.id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if there are products in this category
    const hasProducts = products.some(p => p.category_id === categories[categoryIndex].id);
    
    if (hasProducts) {
      return res.status(400).json({ 
        message: 'Cannot delete category with associated products. Remove all products first.' 
      });
    }
    
    // In a real app, you'd delete from database and storage
    const deletedCategory = categories.splice(categoryIndex, 1)[0];
    
    res.json({ message: 'Category removed', category: deletedCategory });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all categories with admin details
 * @route   GET /api/admin/categories
 * @access  Private/Admin
 */
const getAdminCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    let categoriesData;
    let totalCount;
    
    try {
      // Base query
      let query = `
        SELECT 
          c.id, 
          c.name, 
          c.description,
          c.slug,
          c.image,
          c.created_at,
          (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
        FROM categories c
      `;
      
      let countQuery = 'SELECT COUNT(*) as total FROM categories';
      
      // Add search filter
      if (search) {
        query += ` WHERE c.name LIKE ? OR c.description LIKE ?`;
        countQuery += ` WHERE name LIKE ? OR description LIKE ?`;
      }
      
      // Add sorting
      query += ` ORDER BY c.created_at DESC`;
      
      // Add pagination
      query += ` LIMIT ? OFFSET ?`;
      
      // Execute queries
      let queryParams = [];
      let countParams = [];
      
      if (search) {
        const searchParam = `%${search}%`;
        queryParams = [searchParam, searchParam, limit, offset];
        countParams = [searchParam, searchParam];
      } else {
        queryParams = [limit, offset];
      }
      
      [categoriesData] = await pool.query(query, queryParams);
      const [countResult] = await pool.query(countQuery, countParams);
      totalCount = countResult[0].total;
      
    } catch (dbError) {
      logger.error('Database error for admin categories, using mock data:', dbError);
      
      // Fall back to mock data
      // Calculate product count for each category
      let filteredCategories = categories;
      
      // Apply search if needed
      if (search) {
        filteredCategories = filteredCategories.filter(c => 
          c.name.toLowerCase().includes(search.toLowerCase()) || 
          (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      const categoriesWithCount = filteredCategories.map(category => {
        const productCount = products.filter(p => p.category_id === category.id).length;
        return {
          ...category,
          product_count: productCount
        };
      });
      
      // Apply pagination
      categoriesData = categoriesWithCount.slice(offset, offset + limit);
      totalCount = filteredCategories.length;
    }
    
    res.json({
      categories: categoriesData,
      page,
      pages: Math.ceil(totalCount / limit),
      total: totalCount
    });
  } catch (error) {
    logger.error('Error fetching admin categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminCategories
}; 
import express from 'express';
import { protect, ownerOnly } from '../middleware/auth.js';
import Subject from '../models/Subject.js';
import Domain from '../models/Domain.js';
import Category from '../models/Category.js';
import Lesson from '../models/Lesson.js';

const router = express.Router();

// @route   GET /api/admin/content
// @desc    Get all content for admin management
// @access  Owner only
router.get('/content', protect, ownerOnly, async (req, res) => {
    try {
        const [subjects, domains, categories, lessons] = await Promise.all([
            Subject.find().populate('managedBy', 'username').sort({ createdAt: -1 }),
            Domain.find().populate('subject', 'name').sort({ createdAt: -1 }),
            Category.find().populate('domain', 'name').sort({ createdAt: -1 }),
            Lesson.find().populate('category', 'name').populate('creators', 'username').sort({ createdAt: -1 })
        ]);

        res.json({
            success: true,
            data: {
                subjects,
                domains,
                categories,
                lessons,
                stats: {
                    totalSubjects: subjects.length,
                    totalDomains: domains.length,
                    totalCategories: categories.length,
                    totalLessons: lessons.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/admin/subject/:id
// @desc    Delete subject and all related content
// @access  Owner only
router.delete('/subject/:id', protect, ownerOnly, async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        // Delete all related content in cascade
        const domains = await Domain.find({ subject: req.params.id });
        const domainIds = domains.map(d => d._id);
        
        const categories = await Category.find({ domain: { $in: domainIds } });
        const categoryIds = categories.map(c => c._id);
        
        // Delete lessons first
        await Lesson.deleteMany({ category: { $in: categoryIds } });
        
        // Delete categories
        await Category.deleteMany({ domain: { $in: domainIds } });
        
        // Delete domains
        await Domain.deleteMany({ subject: req.params.id });
        
        // Delete subject
        await Subject.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Subject "${subject.name}" and all related content deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/admin/domain/:id
// @desc    Delete domain and all related content
// @access  Owner only
router.delete('/domain/:id', protect, ownerOnly, async (req, res) => {
    try {
        const domain = await Domain.findById(req.params.id).populate('subject', 'name');
        if (!domain) {
            return res.status(404).json({ success: false, message: 'Domain not found' });
        }

        // Delete all related content
        const categories = await Category.find({ domain: req.params.id });
        const categoryIds = categories.map(c => c._id);
        
        // Delete lessons
        await Lesson.deleteMany({ category: { $in: categoryIds } });
        
        // Delete categories
        await Category.deleteMany({ domain: req.params.id });
        
        // Remove domain from subject
        await Subject.findByIdAndUpdate(domain.subject._id, {
            $pull: { domains: req.params.id }
        });
        
        // Delete domain
        await Domain.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Domain "${domain.name}" and all related content deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/admin/category/:id
// @desc    Delete category and all related lessons
// @access  Owner only
router.delete('/category/:id', protect, ownerOnly, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('domain', 'name');
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Delete all lessons in this category
        await Lesson.deleteMany({ category: req.params.id });
        
        // Remove category from domain
        await Domain.findByIdAndUpdate(category.domain._id, {
            $pull: { categories: req.params.id }
        });
        
        // Delete category
        await Category.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Category "${category.name}" and all related lessons deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/admin/lesson/:id
// @desc    Delete lesson
// @access  Owner only
router.delete('/lesson/:id', protect, ownerOnly, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        // Remove lesson from category
        await Category.findByIdAndUpdate(lesson.category, {
            $pull: { lessons: req.params.id }
        });
        
        // Delete lesson
        await Lesson.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Lesson "${lesson.title}" deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
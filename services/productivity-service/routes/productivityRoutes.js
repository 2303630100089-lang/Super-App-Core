import express from 'express';
import workspaceController from '../controllers/workspaceController.js';
import pageController from '../controllers/pageController.js';
import * as taskController from '../controllers/taskController.js';
import * as calendarController from '../controllers/calendarController.js';

const router = express.Router();

// Workspaces
router.post('/workspaces', workspaceController.createWorkspace);
router.get('/workspaces/user/:userId', workspaceController.getWorkspaces);
router.post('/workspaces/add-member', workspaceController.addMember);

// Pages
router.post('/pages', pageController.createPage);
router.get('/pages/:pageId', pageController.getPage);
router.patch('/pages/:pageId', pageController.updatePage);
router.get('/workspaces/:workspaceId/pages', pageController.getWorkspacePages);

// Forms
router.post('/forms', workspaceController.createForm);
router.get('/forms/user/:userId', workspaceController.getUserForms);
router.get('/forms/:id', workspaceController.getFormById);
router.post('/forms/:id/submit', workspaceController.submitResponse);

// Tasks
router.get('/tasks', taskController.getTasks);
router.get('/tasks/user/:userId', taskController.getTasks);
router.post('/tasks', taskController.createTask);
router.patch('/tasks/:taskId', taskController.updateTask);
router.delete('/tasks/:taskId', taskController.deleteTask);

// Calendar Events
router.get('/calendar', calendarController.getEvents);
router.get('/calendar/user/:userId', calendarController.getEvents);
router.post('/calendar', calendarController.createEvent);
router.patch('/calendar/:eventId', calendarController.updateEvent);
router.delete('/calendar/:eventId', calendarController.deleteEvent);

export default router;

import express from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Profile
router.post('/profile', paymentController.createProfile);
router.get('/profile/:userId', paymentController.getProfile);
router.get('/profile', paymentController.getProfile); // self via headers

// P2P Transfer
router.post('/transfer', paymentController.initiateTransfer);

// Top-up
router.post('/topup', paymentController.addMoney);

// QR Payments
router.post('/qr/generate', paymentController.generateQRPayment);
router.post('/qr/pay', paymentController.payViaQR);

// Merchant Payment
router.post('/merchant/pay', paymentController.merchantPayment);

// Refunds
router.post('/refund', paymentController.initiateRefund);

// Device Binding
router.post('/device/bind', paymentController.bindDevice);
router.post('/device/unbind', paymentController.unbindDevice);

// Transactions
router.get('/transactions/:userId', paymentController.getTransactions);
router.get('/transactions', paymentController.getTransactions); // self via headers

export default router;

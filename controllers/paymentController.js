import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from './notificationController.js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Create checkout session for resource purchase
export const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment system not configured. Please add STRIPE_SECRET_KEY to environment variables.'
      });
    }

    const { resourceId } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    if (!resource.isPremium) {
      return res.status(400).json({ 
        success: false, 
        message: 'This resource is not premium' 
      });
    }

    // Create payment record
    const payment = await Payment.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      resource: resourceId,
      resourceTitle: resource.title,
      amount: resource.price,
      currency: resource.currency.toLowerCase(),
      status: 'pending',
      transactionId: uuidv4()
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: resource.currency.toLowerCase(),
          product_data: {
            name: resource.title,
            description: resource.description.substring(0, 200),
          },
          unit_amount: Math.round(resource.price * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`,
      customer_email: req.user.email,
      client_reference_id: payment._id.toString(),
      metadata: {
        paymentId: payment._id.toString(),
        userId: req.user.id,
        resourceId: resourceId
      }
    });

    // Update payment with session ID
    payment.stripeSessionId = session.id;
    await payment.save();

    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create checkout session',
      error: error.message 
    });
  }
};

// Webhook handler for Stripe events
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Handle successful checkout session
const handleCheckoutSessionCompleted = async (session) => {
  try {
    const paymentId = session.metadata.paymentId;
    const payment = await Payment.findById(paymentId);

    if (payment) {
      payment.status = 'completed';
      payment.stripePaymentIntentId = session.payment_intent;
      payment.completedAt = new Date();
      await payment.save();

      // Update user
      const user = await User.findById(payment.user);
      if (user) {
        user.paymentHistory.push(payment._id);
        user.totalSpent += payment.amount;
        await user.save();
      }

      // Update resource purchase count
      if (payment.resource) {
        await Resource.findByIdAndUpdate(payment.resource, {
          $inc: { purchaseCount: 1 }
        });
      }

      // Create notification
      await createNotification({
        recipient: payment.user,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of $${payment.amount} for "${payment.resourceTitle}" was successful!`,
        link: `/resource/${payment.resource}`,
        metadata: {
          paymentId: payment._id.toString(),
          resourceId: payment.resource?.toString()
        }
      });
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
};

// Handle successful payment intent
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  console.log('Payment intent succeeded:', paymentIntent.id);
};

// Handle failed payment intent
const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });

    if (payment) {
      payment.status = 'failed';
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await payment.save();

      // Create notification
      await createNotification({
        recipient: payment.user,
        type: 'system',
        title: 'Payment Failed',
        message: `Your payment for "${payment.resourceTitle}" failed. Please try again.`,
        metadata: {
          paymentId: payment._id.toString()
        }
      });
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('resource', 'title type');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment history',
      error: error.message 
    });
  }
};

// Get single payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('resource', 'title description type');

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment details',
      error: error.message 
    });
  }
};

// Verify payment session (after redirect from Stripe)
export const verifyPaymentSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    const payment = await Payment.findOne({ 
      stripeSessionId: sessionId 
    }).populate('resource', 'title fileUrl fileName');

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        payment,
        session: {
          status: session.payment_status,
          customerEmail: session.customer_email
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify payment',
      error: error.message 
    });
  }
};

// Get payment statistics (Admin)
export const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('resource', 'title');

    res.json({
      success: true,
      data: {
        stats,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentPayments
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment statistics',
      error: error.message 
    });
  }
};

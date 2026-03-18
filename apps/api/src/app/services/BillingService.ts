import { prisma } from '../../config/database';
import { getStripe } from '../../config/stripe';
import { config } from '../../config/app';
import { organizationRepository } from '../repositories/OrganizationRepository';
import { NotFoundError, AppError } from '../errors/AppError';
import Stripe from 'stripe';

export class BillingService {
  async getPlans() {
    return prisma.plan.findMany({ orderBy: { monthlyPriceUsd: 'asc' } });
  }

  async getSubscription(orgId: string) {
    const sub = await prisma.subscription.findUnique({
      where:   { orgId },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundError('Subscription');
    return sub;
  }

  async createCheckoutSession(orgId: string, priceId: string, userId: string) {
    const stripe = getStripe();
    const org    = await organizationRepository.findWithSubscription(orgId);
    if (!org) throw new NotFoundError('Organization');

    let customerId = org.subscription?.stripeCustomerId || undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { orgId, userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${config.frontendUrl}/billing?success=1`,
      cancel_url:  `${config.frontendUrl}/billing?cancelled=1`,
      metadata:    { orgId },
    });

    // Save customerId if new
    if (!org.subscription?.stripeCustomerId) {
      await prisma.subscription.update({
        where: { orgId },
        data:  { stripeCustomerId: customerId },
      });
    }

    return { url: session.url };
  }

  async createPortalSession(orgId: string) {
    const stripe = getStripe();
    const sub    = await prisma.subscription.findUnique({ where: { orgId } });
    if (!sub?.stripeCustomerId) {
      throw new AppError(400, 'NO_CUSTOMER', 'No billing account found. Subscribe first.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   sub.stripeCustomerId,
      return_url: `${config.frontendUrl}/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
    } catch {
      throw new AppError(400, 'INVALID_SIGNATURE', 'Invalid webhook signature');
    }

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await this.syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private async syncSubscription(stripeSub: Stripe.Subscription) {
    const orgId   = stripeSub.metadata.orgId;
    const priceId = stripeSub.items.data[0]?.price.id;
    if (!orgId || !priceId) return;

    const plan = await prisma.plan.findFirst({ where: { stripePriceId: priceId } });
    if (!plan) return;

    await prisma.subscription.update({
      where: { orgId },
      data: {
        stripeSubscriptionId: stripeSub.id,
        status:               stripeSub.status.toUpperCase() as any,
        planId:               plan.id,
        currentPeriodStart:   new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd:     new Date(stripeSub.current_period_end   * 1000),
        cancelAtPeriodEnd:    stripeSub.cancel_at_period_end,
      },
    });
  }

  private async cancelSubscription(stripeSub: Stripe.Subscription) {
    const orgId = stripeSub.metadata.orgId;
    if (!orgId) return;

    const basicPlan = await prisma.plan.findUnique({ where: { tier: 'BASIC' } });
    if (!basicPlan) return;

    await prisma.subscription.update({
      where: { orgId },
      data: {
        status:            'CANCELLED',
        planId:            basicPlan.id,
        cancelAtPeriodEnd: false,
      },
    });
  }
}

export const billingService = new BillingService();

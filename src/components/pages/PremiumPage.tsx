import { useEffect, useState } from "react";
import { Check, Crown, Sparkles, Zap, Loader2, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Progress } from "../ui/progress";
import { toast } from "sonner";
import subscriptionService, { Subscription } from "../../services/subscriptionService";
import paymentService from "../../services/paymentService";

export function PremiumPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const sub = await subscriptionService.getCurrentSubscription();
      setSubscription(sub);
    } catch (error: any) {
      toast.error(error.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      await paymentService.redirectToCheckout();
    } catch (error: any) {
      toast.error(error.message || "Failed to start upgrade process");
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await paymentService.redirectToPortal();
    } catch (error: any) {
      toast.error(error.message || "Failed to open billing portal");
    }
  };

  const isPremium = subscription?.plan === "PREMIUM";

  const features = {
    free: [
      "3 AI resume tailors/month",
      "3 cover letters/month",
      "Job match scores",
      "Basic dashboard",
      "Email support",
    ],
    premium: [
      "50 AI resume tailors/month",
      "50 cover letters/month",
      "Advanced job match algorithm",
      "Application analytics & insights",
      "Job alerts & notifications",
      "Priority email support",
      "Resume templates library",
      "Interview preparation tips",
      "Salary negotiation guidance",
      "LinkedIn profile optimization",
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B4D8] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00B4D8]/10 to-[#0077B6]/10 border border-[#00B4D8]/20 mb-4">
          <Crown className="h-4 w-4 text-[#0077B6]" />
          <span className="text-sm">
            {isPremium ? "Premium Active" : "Unlock Premium Features"}
          </span>
        </div>
        <h1 className="text-4xl mb-4">
          {isPremium ? "Your Premium Plan" : "Choose Your Plan"}
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          {isPremium
            ? "Enjoy unlimited access to all premium features"
            : "Start free, upgrade when you need more"}
        </p>

        {!isPremium && (
          <div className="flex items-center justify-center gap-3">
            <span className={!isAnnual ? "" : "text-muted-foreground"}>Monthly</span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
            <span className={isAnnual ? "" : "text-muted-foreground"}>
              Annual <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </span>
          </div>
        )}
      </div>

      {/* Current Subscription Status (if Premium) */}
      {isPremium && subscription && (
        <Card className="max-w-4xl mx-auto border-[#00B4D8] border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-[#00B4D8]" />
                  Premium Subscription
                </CardTitle>
                <CardDescription>Active and in good standing</CardDescription>
              </div>
              <Badge className="bg-green-500">
                {subscription.cancelAtPeriodEnd ? "Canceling at Period End" : "Active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Period</p>
                <p className="text-sm">
                  {subscription.currentPeriodEnd &&
                    new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="text-sm capitalize">{subscription.status}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>AI Resume Tailoring</span>
                  <span className="text-[#00B4D8]">Unlimited ✨</span>
                </div>
                <Progress value={100} className="h-2 bg-[#00B4D8]/20" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Cover Letter Generation</span>
                  <span className="text-[#00B4D8]">Unlimited ✨</span>
                </div>
                <Progress value={100} className="h-2 bg-[#00B4D8]/20" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleManageSubscription}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <Card className={isPremium ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Free
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Free forever</p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isPremium}
            >
              {isPremium ? "Previous Plan" : "Current Plan"}
            </Button>

            <div className="space-y-3">
              <p className="text-sm">Includes:</p>
              {features.free.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#00B4D8] flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="border-[#00B4D8] border-2 relative overflow-hidden">
          {!isPremium && (
            <div className="absolute top-0 right-0 bg-gradient-to-br from-[#00B4D8] to-[#0077B6] text-white px-4 py-1 text-sm">
              Most Popular
            </div>
          )}
          {isPremium && (
            <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 text-sm">
              Your Plan
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#00B4D8]" />
              Premium
            </CardTitle>
            <CardDescription>For serious job seekers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl">
                  ${isAnnual ? "15" : "19"}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {isAnnual && (
                <p className="text-sm text-[#00B4D8] mt-2">
                  Billed $180 annually (save $48)
                </p>
              )}
            </div>

            {isPremium ? (
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={handleManageSubscription}
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Manage Billing
              </Button>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Upgrade to Premium
                  </>
                )}
              </Button>
            )}

            <div className="space-y-3">
              <p className="text-sm">Everything in Free, plus:</p>
              {features.premium.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#00B4D8] flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Compare Plans</CardTitle>
            <CardDescription>See what's included in each plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4">Feature</th>
                    <th className="text-center py-4 px-4">Free</th>
                    <th className="text-center py-4 px-4">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-4">AI Resume Tailoring</td>
                    <td className="text-center py-4">3/month</td>
                    <td className="text-center py-4">
                      <Zap className="inline h-5 w-5 text-[#00B4D8]" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4">Cover Letter Generation</td>
                    <td className="text-center py-4">3/month</td>
                    <td className="text-center py-4">
                      <Zap className="inline h-5 w-5 text-[#00B4D8]" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4">Job Match Scores</td>
                    <td className="text-center py-4">
                      <Check className="inline h-5 w-5 text-green-600" />
                    </td>
                    <td className="text-center py-4">
                      <Check className="inline h-5 w-5 text-green-600" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4">Application Analytics</td>
                    <td className="text-center py-4 text-muted-foreground">—</td>
                    <td className="text-center py-4">
                      <Check className="inline h-5 w-5 text-green-600" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4">Job Alerts</td>
                    <td className="text-center py-4 text-muted-foreground">—</td>
                    <td className="text-center py-4">
                      <Check className="inline h-5 w-5 text-green-600" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4">Priority Support</td>
                    <td className="text-center py-4 text-muted-foreground">—</td>
                    <td className="text-center py-4">
                      <Check className="inline h-5 w-5 text-green-600" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl text-center mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor Stripe.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is there a refund policy?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We offer a 7-day money-back guarantee. If you're not satisfied with Premium, contact us within 7 days for a full refund.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      {!isPremium && (
        <div className="text-center py-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl mb-4">Ready to accelerate your job search?</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Join thousands of successful job seekers using JobHuntAI
            </p>
            <Button size="lg" className="px-8" onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Secure checkout powered by Stripe • Cancel anytime
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

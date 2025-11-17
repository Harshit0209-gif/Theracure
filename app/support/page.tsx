"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Phone,
  Mail,
  MessageCircle,
  User,
  HeadphonesIcon,
  AlertCircle,
  FileText,
  HelpCircle,
  Book,
  Send,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

export default function Support() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const supportTeam = {
    id: 1,
    name: "Mr. Himalaya Mukherjee",
    role: "Managing Director",
    phone: "+91 6289203262",
    email: "support@golicit.in",
    specialization: "Platform Issues & Account Management",
    languages: ["English", "Hindi", "Bengali"],
  };

  const quickActions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      action: "Start Chat",
      color: "bg-blue-500",
      href: "#",
    },
    {
      icon: Phone,
      title: "Call Support",
      description: "Speak directly with our team",
      action: "Call Now",
      color: "bg-green-500",
      href: `tel:+916289203262`,
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us your detailed questions",
      action: "Send Email",
      color: "bg-purple-500",
      href: "mailto:support@golicit.in",
    },
  ];

  const popularArticles = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of using the platform",
      icon: Book,
    },
    {
      title: "Managing Appointments",
      description: "How to schedule and manage appointments",
      icon: FileText,
    },
    {
      title: "Payment & Billing",
      description: "Understanding payments and invoices",
      icon: HelpCircle,
    },
    {
      title: "Account Settings",
      description: "Manage your profile and preferences",
      icon: User,
    },
  ];

  const faqData = [
    {
      category: "Account & Profile",
      questions: [
        {
          question: "How do I update my profile information?",
          answer:
            "Go to your profile page by clicking on your avatar in the top right corner. Select 'My Profile' from the dropdown menu. Click the 'Edit Profile' button to update your information, then save your changes.",
        },
        {
          question: "How can I recover my forgotten password?",
          answer:
            "On the login page, click 'Forgot Password'. Enter your registered email address and we'll send you a password reset link. Follow the instructions in the email to set a new password.",
        },
        {
          question: "What is the account verification process?",
          answer:
            "After registration, check your email for a verification link. Click the link to verify your account. For therapists, additional document verification may be required for professional credentials.",
        },
        {
          question: "How do I change my profile visibility settings?",
          answer:
            "Navigate to Settings > Privacy. Here you can control who can see your profile, availability, and contact information. Choose between Public, Connections Only, or Private.",
        },
      ],
    },
    {
      category: "Technical Issues",
      questions: [
        {
          question: "Why is the app not loading properly?",
          answer:
            "Try clearing your browser cache and cookies, or updating your browser to the latest version. If the issue persists, try accessing the platform from a different browser or device. Contact support if problems continue.",
        },
        {
          question: "I'm experiencing connection problems",
          answer:
            "Check your internet connection first. If your connection is stable, try logging out and logging back in. For persistent issues, contact our technical support team.",
        },
        {
          question: "What should I do if I encounter payment gateway issues?",
          answer:
            "Verify your payment details are correct and your card is active. Ensure your bank allows online transactions. If issues persist, try a different payment method or contact our support team.",
        },
        {
          question: "The mobile app keeps crashing",
          answer:
            "Update the app to the latest version from your app store. Clear the app cache in your device settings. If the problem continues, uninstall and reinstall the app, or contact support.",
        },
      ],
    },
    {
      category: "For Therapists",
      questions: [
        {
          question: "How do I set up my professional profile?",
          answer:
            "After registering as a therapist, go to your profile and click 'Complete Professional Profile'. Upload your credentials, certifications, and add your specializations. Include your experience and education details.",
        },
        {
          question: "How can I manage my appointments?",
          answer:
            "Access your dashboard and navigate to 'Appointments'. Here you can view, schedule, reschedule, or cancel appointments. Set your availability in the 'Schedule' section.",
        },
        {
          question: "How does payment and billing work?",
          answer:
            "You'll receive payments directly to your registered bank account. View your earnings in the 'Billing' section. Payments are processed within 2-3 business days after session completion.",
        },
        {
          question: "What is the certification verification process?",
          answer:
            "Upload clear copies of your professional certifications and licenses in your profile. Our team will verify these documents within 24-48 hours. You'll receive a notification once verified.",
        },
      ],
    },
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
    // Reset form
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Help & Support Center
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Get in touch with our support team. We're here to help you succeed.
          </p>
        </div>

        {/* Emergency Alert */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">
                  Emergency Support
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  For critical issues affecting patient safety or urgent
                  technical problems, call our emergency hotline:{" "}
                  <a
                    href="tel:+916289203262"
                    className="font-bold hover:underline"
                  >
                    +91 6289203262
                  </a>{" "}
                  (Available 24/7)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Contact Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <a key={index} href={action.href} className="block">
              <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div
                      className={`${action.color} w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-lg`}
                    >
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                    <Button size="sm" className="w-full">
                      {action.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        {/* Popular Help Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Popular Help Articles
            </CardTitle>
            <CardDescription>
              Frequently accessed guides and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularArticles.map((article, index) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow cursor-pointer border-gray-200"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <article.icon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1.5">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {article.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout: Support Contact + Submit Ticket Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Support Team Contact */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeadphonesIcon className="h-5 w-5 text-indigo-600" />
                Contact Support Team
              </CardTitle>
              <CardDescription>
                Get direct assistance from our support specialist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                  <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {supportTeam.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {supportTeam.role}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={`tel:${supportTeam.phone}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {supportTeam.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={`mailto:${supportTeam.email}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium break-all"
                        >
                          {supportTeam.email}
                        </a>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1.5">
                        SPECIALIZATION
                      </p>
                      <p className="text-sm text-gray-600">
                        {supportTeam.specialization}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1.5">
                        LANGUAGES
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {supportTeam.languages.map((lang, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-white"
                          >
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Support Ticket Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" />
                Submit a Support Ticket
              </CardTitle>
              <CardDescription>
                Can't find what you're looking for? Send us a message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Subject
                  </label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your issue in detail..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </Button>

                <p className="text-xs text-center text-gray-500">
                  We typically respond within 24 hours during business days
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section with Accordion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-600" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            {faqData.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {category.category}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`${categoryIndex}-${index}`}
                    >
                      <AccordionTrigger className="text-left hover:text-indigo-600">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Additional Resources
            </CardTitle>
            <CardDescription>
              Explore more ways to learn and get help
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-6 flex-col items-start hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              >
                <FileText className="h-8 w-8 mb-3 text-indigo-600" />
                <span className="font-semibold text-base mb-2">User Guide</span>
                <span className="text-sm text-gray-600">
                  Complete platform documentation and tutorials
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 flex-col items-start hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                <Book className="h-8 w-8 mb-3 text-green-600" />
                <span className="font-semibold text-base mb-2">Knowledge Base</span>
                <span className="text-sm text-gray-600">
                  Browse articles organized by topic and category
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

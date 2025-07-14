import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  User,
  HeadphonesIcon,
  AlertCircle,
  FileText,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export default function Support() {
  const supportTeam = [
    {
      id: 1,
      name: "Mr. Himalaya Mukherjee",
      role: "Managing Director",
      phone: "+91 6289203262",
      email: "support@golicit.in",
      specialization: "Platform Issues & Account Management",
      availability: "Mon-Fri, 9:00 AM - 6:00 PM",
      languages: ["English", "Hindi", "Bengali"],
    },
  ];

  const quickActions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help with our live chat support",
      action: "Start Chat",
      color: "bg-blue-500",
    },
    {
      icon: Phone,
      title: "Call Support",
      description: "Speak directly with our technical team",
      action: "Call Now",
      color: "bg-green-500",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us your questions and get detailed responses",
      action: "Send Email",
      color: "bg-purple-500",
    },
  ];

  const faqCategories = [
    {
      title: "Account & Profile",
      items: [
        "How to update my profile information?",
        "Forgot password recovery",
        "Account verification process",
        "Profile visibility settings",
      ],
    },
    {
      title: "Technical Issues",
      items: [
        "App not loading properly",
        "Connection problems",
        "Payment gateway issues",
        "Mobile app crashes",
      ],
    },
    {
      title: "For Therapists",
      items: [
        "Setting up professional profile",
        "Managing appointments",
        "Payment and billing",
        "Certification verification",
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our dedicated support team is here to help you with any questions or
            issues you may have. Choose the best way to reach us based on your
            needs.
          </p>
        </div>

        {/* Emergency Alert */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-900">Emergency Support</h3>
                <p className="text-sm text-red-700 mt-1">
                  For critical issues affecting patient safety or urgent
                  technical problems, call our emergency hotline:{" "}
                  <strong>+91 6289203262</strong> (Available 24/7)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div
                    className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  <Button size="sm" className="w-full">
                    {action.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Support Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeadphonesIcon className="h-5 w-5" />
              Our Support Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {supportTeam.map((member) => (
                <Card key={member.id} className="border-0 shadow-sm bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Member Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {member.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a
                            href={`tel:${member.phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {member.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a
                            href={`mailto:${member.email}`}
                            className="text-blue-600 hover:text-blue-800 break-all"
                          >
                            {member.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {member.availability}
                          </span>
                        </div>
                      </div>

                      {/* Specialization */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Specialization
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.specialization}
                        </p>
                      </div>

                      {/* Languages */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Languages
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {member.languages.map((lang, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqCategories.map((category, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="font-medium text-gray-900">
                    {category.title}
                  </h3>
                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <Button
                        key={itemIndex}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 text-sm text-left hover:bg-gray-50"
                      >
                        <span className="truncate">{item}</span>
                        <ExternalLink className="h-3 w-3 ml-2 flex-shrink-0" />
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex-col items-start"
              >
                <FileText className="h-5 w-5 mb-2 text-blue-600" />
                <span className="font-medium">User Guide</span>
                <span className="text-sm text-gray-600">
                  Complete platform documentation
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex-col items-start"
              >
                <MessageCircle className="h-5 w-5 mb-2 text-green-600" />
                <span className="font-medium">Community Forum</span>
                <span className="text-sm text-gray-600">
                  Connect with other users
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex-col items-start"
              >
                <HelpCircle className="h-5 w-5 mb-2 text-purple-600" />
                <span className="font-medium">Video Tutorials</span>
                <span className="text-sm text-gray-600">
                  Step-by-step guides
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Hours */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-medium text-gray-900">Support Hours</h3>
              <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Monday - Friday: 9:00 AM - 6:00 PM</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Saturday: 10:00 AM - 4:00 PM</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Emergency: 24/7</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

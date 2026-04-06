"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, FileText, Lock, Shield } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      content: `
        <p>At Diplomat Corner, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p>
        <p>Please read this Privacy Policy carefully. By accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.</p>
        <p>We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates.</p>
      `,
    },
    {
      id: "collection",
      title: "Information We Collect",
      content: `
        <p>We may collect information about you in a variety of ways. The information we may collect includes:</p>
        <h4 class="font-medium text-gray-800 mt-4 mb-2">Personal Data</h4>
        <p>Personally identifiable information, such as your name, email address, telephone number, and demographic information that you voluntarily give to us when you register with us or when you choose to participate in various activities related to our services. You are under no obligation to provide us with personal information of any kind, however, your refusal to do so may prevent you from using certain features of our services.</p>
        <h4 class="font-medium text-gray-800 mt-4 mb-2">Derivative Data</h4>
        <p>Information our servers automatically collect when you access our services, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing our services.</p>
        <h4 class="font-medium text-gray-800 mt-4 mb-2">Financial Data</h4>
        <p>Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services. We store only very limited, if any, financial information that we collect.</p>
        <h4 class="font-medium text-gray-800 mt-4 mb-2">Mobile Device Data</h4>
        <p>Device information, such as your mobile device ID, model, and manufacturer, and information about the location of your device, if you access our services from a mobile device.</p>
      `,
    },
    {
      id: "use",
      title: "How We Use Your Information",
      content: `
        <p>We may use the information we collect about you for a variety of purposes, including to:</p>
        <ul class="list-disc pl-5 space-y-2 mt-2">
          <li>Create and manage your account</li>
          <li>Process transactions and send you related information, including confirmations and invoices</li>
          <li>Send you technical notices, updates, security alerts, and support and administrative messages</li>
          <li>Respond to your comments, questions, and requests</li>
          <li>Provide, maintain, and improve our services</li>
          <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
          <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
          <li>Personalize and improve your experience on our services</li>
          <li>Carry out any other purpose for which the information was collected</li>
        </ul>
      `,
    },
    {
      id: "disclosure",
      title: "Disclosure of Your Information",
      content: `
        <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
        <h4 class="font-medium text-gray-800 mt-4 mb-2">By Law or to Protect Rights</h4>
        <p>If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</p>
        <h4 class="font-medium text-gray-800 mt-4 mb-2">Third-Party Service Providers</h4>
        <p>We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</p>
        <h4 class="font-medium text-gray-800 mt-4 mb-2">Marketing Communications</h4>
        <p>With your consent, or with an opportunity for you to withdraw consent, we may share your information with third parties for marketing purposes.</p>
        <h4 class="font-medium text-gray-800 mt-4 mb-2">Interactions with Other Users</h4>
        <p>If you interact with other users of our services, those users may see your name, profile photo, and descriptions of your activity.</p>
        <h4 class="font-medium text-gray-800 mt-4 mb-2">Online Postings</h4>
        <p>When you post comments, contributions, or other content to our services, your posts may be viewed by all users and may be publicly distributed outside our services in perpetuity.</p>
      `,
    },
    {
      id: "security",
      title: "Security of Your Information",
      content: `
        <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
        <p>Any information disclosed online is vulnerable to interception and misuse by unauthorized parties. Therefore, we cannot guarantee complete security if you provide personal information.</p>
      `,
    },
    {
      id: "cookies",
      title: "Cookies and Web Beacons",
      content: `
        <p>We may use cookies, web beacons, tracking pixels, and other tracking technologies on our services to help customize and improve your experience. When you access our services, your personal information is not collected through the use of tracking technology.</p>
        <p>Most browsers are set to accept cookies by default. You can remove or reject cookies, but be aware that such action could affect the availability and functionality of our services.</p>
      `,
    },
    {
      id: "children",
      title: "Children's Privacy",
      content: `
        <p>Our services are not intended for use by children under the age of 18, and we do not knowingly collect personal information from children under 18. If we learn we have collected or received personal information from a child under 18 without verification of parental consent, we will delete that information.</p>
      `,
    },
    {
      id: "rights",
      title: "Your Privacy Rights",
      content: `
        <p>You have certain rights regarding the personal information we collect about you. These include:</p>
        <ul class="list-disc pl-5 space-y-2 mt-2">
          <li>The right to access personal information we hold about you</li>
          <li>The right to request that we correct any personal information we hold about you that is inaccurate or incomplete</li>
          <li>The right to request that we delete any personal information we hold about you</li>
          <li>The right to withdraw consent to the processing of your personal information</li>
          <li>The right to request that we provide you with your personal information and, if possible, to transmit that information directly to another data controller</li>
        </ul>
        <p class="mt-4">To exercise any of these rights, please contact us using the contact information provided below.</p>
      `,
    },
    {
      id: "contact",
      title: "Contact Us",
      content: `
        <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
        <p class="mt-2">Diplomat Corner<br>Addis Ababa, Ethiopia</p>
        <p class="mt-2">Email: contact@diplomatcorner.net<br>Phone: +251 911 10 8874</p>
      `,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your privacy is important to us. This Privacy Policy explains how
              we collect, use, and protect your personal information.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <p className="text-sm text-gray-500">
                Last Updated: March 10, 2025
              </p>
              <Link
                href="/terms-of-service"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Table of Contents
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-primary hover:text-primary/80 flex items-center gap-1"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById(section.id)
                        ?.scrollIntoView({ behavior: "smooth" });
                      setActiveSection(section.id);
                    }}
                  >
                    <Shield className="h-4 w-4" />
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Privacy Policy Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {sections.map((section, index) => (
              <div
                key={section.id}
                id={section.id}
                className={`border-b border-gray-100 last:border-b-0 ${
                  activeSection === section.id ? "bg-gray-50" : ""
                }`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-medium text-gray-800">
                    <span className="text-primary mr-2">{index + 1}.</span>{" "}
                    {section.title}
                  </h3>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      activeSection === section.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`px-6 pb-6 transition-all duration-300 overflow-hidden ${
                    activeSection === section.id
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div
                    className="prose prose-gray max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Privacy Concerns?
            </h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about our Privacy Policy or how we
              handle your information, please contact us.
            </p>
            <Link
              href="/contact-us"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              Contact Us
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

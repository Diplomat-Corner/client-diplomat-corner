"use client";

import type React from "react";
import Link from "next/link";
import { SignUpButton, SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { FolderIcon as FolderCode } from "lucide-react";

// Define types for our link data
interface FooterLink {
  label: string;
  href: string;
  target?: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

// Create a reusable link component
const FooterLink: React.FC<FooterLink> = ({ label, href, target }) => (
  <li>
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="text-white/80 hover:text-white transition-colors duration-300 flex items-center group"
    >
      <span className="relative overscroll-auto">
        <span className="inline-block overflow-hidden whitespace-nowrap transform transition-transform duration-300 group-hover:translate-x-1">
          {label}
        </span>
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
      </span>
    </Link>
  </li>
);

// Define our footer sections data
const footerSections: FooterSection[] = [
  {
    title: "Connect",
    links: [
      { label: "Contact", href: "/contact-us" },
      { label: "About Us", href: "/about-us" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Buy Car", href: "/car-for-sale" },
      { label: "Rent House", href: "/house-for-rent" },
      { label: "Rent Car", href: "/car-for-rent" },

      {
        label: "Grocery",
        href: "http://www.kedamegebeya.com/?v=ae41a6d38b78",
        target: "_blank",
      },
      {
        label: "Items For Sale",
        href: "https://groups.google.com/g/diplomatcorner",
        target: "_blank",
      },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Terms and Services", href: "/terms-of-service" },
      { label: "Policy", href: "/privacy-policy" },
      { label: "About Us", href: "/about-us" },
      // { label: "Log In", href: "/sign-in" },
    ],
  },
];

// Social media links
const socialLinks = [
  {
    name: "Facebook",
    href: "#",
    target: "_blank",
    icon: (
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    ),
  },
  {
    name: "Instagram",
    href: "#",
    target: "_blank",
    icon: (
      <path
        fillRule="evenodd"
        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
        clipRule="evenodd"
      />
    ),
  },
  {
    name: "Twitter",
    href: "#",
    target: "_blank",
    icon: (
      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
    ),
  },
];

const Footer: React.FC = () => {
  const { isSignedIn } = useAuth();

  return (
    <footer className="bg-gradient-to-b from-[#5B8F2D]/90 to-[#5B8F2D]/95 py-10 backdrop-filter backdrop-blur-sm shadow-inner shadow-[#4a7825]/10">
      <div className="container mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
        {/* Logo Section */}
        <div className="flex flex-col justify-start">
          <div className="flex flex-col">
            <h3 className="text-white text-lg font-semibold tracking-wide">
              Diplomat
            </h3>
            <span className="mt-[-5px] text-white/80 font-bold tracking-wider">
              Corner
            </span>
          </div>
          <p className="text-sm text-white/70 mt-3">&copy; 2025</p>
        </div>

        {/* Mapped Footer Sections */}
        {footerSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-white mb-4 tracking-wide">
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </ul>
          </div>
        ))}

        {/* Account Section */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 tracking-wide">
            Account
          </h2>
          <ul className="space-y-3">
            {!isSignedIn ? (
              <>
                <li>
                  <div className="text-white/80 hover:text-white transition-colors duration-300 flex items-center group">
                    <SignInButton>
                      <button className="relative overflow-hidden group flex items-center">
                        <span className="inline-block transform transition-transform duration-300 group-hover:translate-x-1">
                          Sign In
                        </span>
                        <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                      </button>
                    </SignInButton>
                  </div>
                </li>
                <li>
                  <div className="text-white/80 hover:text-white transition-colors duration-300 flex items-center group">
                    <SignUpButton>
                      <button className="relative overflow-hidden group flex items-center">
                        <span className="inline-block transform transition-transform duration-300 group-hover:translate-x-1">
                          Sign Up
                        </span>
                        <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                      </button>
                    </SignUpButton>
                  </div>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/manage-product/house"
                  className="text-white/80 hover:text-white transition-colors duration-300 flex items-center group"
                >
                  <span className="relative overflow-hidden">
                    <span className="inline-block transform transition-transform duration-300 group-hover:translate-x-1">
                      Add Products
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="container mx-auto px-4 mt-8 pt-6 border-t border-white/15">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/70">
            Diplomat Corner — All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://sydek.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <FolderCode className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
              <span>Developed By Sydek</span>
            </Link>
            <Link
              href="https://sydek.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Image
                src="/assets/images/sydek-logo.png"
                alt="sydek logo"
                width={30}
                height={30}
                className="rounded-lg opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
              />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

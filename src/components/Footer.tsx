import { Mail, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card/50 border-t border-border py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Zenkash. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link 
              to="/terms"
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <FileText className="w-4 h-4" />
              Terms & Conditions
            </Link>
            
            <a 
              href="mailto:support@zenkash.co.ke"
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4" />
              support@zenkash.co.ke
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

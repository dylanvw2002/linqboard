import { Calendar, Clipboard, FileText, Target, Clock, CheckSquare, Archive, CheckCircle2, Zap, Paperclip, Layout } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const BackgroundIcons = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0,
        rootMargin: '100px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  if (!isVisible) {
    return <div ref={ref} className="fixed inset-0 pointer-events-none" />;
  }

  return (
    <div ref={ref} className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Desktop icons - hidden on mobile */}
      <div className="hidden md:block">
        <Calendar className="absolute top-[5%] left-[5%] w-10 h-10 text-primary opacity-5" />
        <Clipboard className="absolute top-[5%] left-[30%] w-10 h-10 text-primary opacity-5" />
        <FileText className="absolute top-[5%] left-[55%] w-10 h-10 text-primary opacity-5" />
        <Target className="absolute top-[5%] left-[80%] w-10 h-10 text-primary opacity-5" />
        
        <Clock className="absolute top-[20%] left-[10%] w-10 h-10 text-primary opacity-5" />
        <CheckSquare className="absolute top-[20%] left-[35%] w-10 h-10 text-primary opacity-5" />
        <Archive className="absolute top-[20%] left-[60%] w-10 h-10 text-primary opacity-5" />
        <CheckCircle2 className="absolute top-[20%] left-[85%] w-10 h-10 text-primary opacity-5" />
        
        <Zap className="absolute top-[35%] left-[5%] w-10 h-10 text-primary opacity-5" />
        <Paperclip className="absolute top-[35%] left-[30%] w-10 h-10 text-primary opacity-5" />
        <Layout className="absolute top-[35%] left-[55%] w-10 h-10 text-primary opacity-5" />
        <Calendar className="absolute top-[35%] left-[80%] w-10 h-10 text-primary opacity-5" />
        
        <Clipboard className="absolute top-[50%] left-[10%] w-10 h-10 text-primary opacity-5" />
        <FileText className="absolute top-[50%] left-[35%] w-10 h-10 text-primary opacity-5" />
        <Target className="absolute top-[50%] left-[60%] w-10 h-10 text-primary opacity-5" />
        <Clock className="absolute top-[50%] left-[85%] w-10 h-10 text-primary opacity-5" />
        
        <CheckSquare className="absolute top-[65%] left-[5%] w-10 h-10 text-primary opacity-5" />
        <Archive className="absolute top-[65%] left-[30%] w-10 h-10 text-primary opacity-5" />
        <CheckCircle2 className="absolute top-[65%] left-[55%] w-10 h-10 text-primary opacity-5" />
        <Zap className="absolute top-[65%] left-[80%] w-10 h-10 text-primary opacity-5" />
        
        <Paperclip className="absolute top-[80%] left-[10%] w-10 h-10 text-primary opacity-5" />
        <Layout className="absolute top-[80%] left-[35%] w-10 h-10 text-primary opacity-5" />
        <Calendar className="absolute top-[80%] left-[60%] w-10 h-10 text-primary opacity-5" />
        <Clipboard className="absolute top-[80%] left-[85%] w-10 h-10 text-primary opacity-5" />
      </div>
      
      {/* Mobile icons - fewer and strategically placed */}
      <div className="block md:hidden">
        <Calendar className="absolute top-[10%] left-[10%] w-10 h-10 text-primary opacity-5" />
        <CheckSquare className="absolute top-[10%] right-[10%] w-10 h-10 text-primary opacity-5" />
        
        <Target className="absolute top-[30%] left-[10%] w-10 h-10 text-primary opacity-5" />
        <Clock className="absolute top-[30%] right-[10%] w-10 h-10 text-primary opacity-5" />
        
        <Zap className="absolute top-[50%] left-[10%] w-10 h-10 text-primary opacity-5" />
        <FileText className="absolute top-[50%] right-[10%] w-10 h-10 text-primary opacity-5" />
        
        <CheckCircle2 className="absolute top-[70%] left-[10%] w-10 h-10 text-primary opacity-5" />
        <Clipboard className="absolute top-[70%] right-[10%] w-10 h-10 text-primary opacity-5" />
        
        <Archive className="absolute top-[90%] left-[10%] w-10 h-10 text-primary opacity-5" />
        <Paperclip className="absolute top-[90%] right-[10%] w-10 h-10 text-primary opacity-5" />
      </div>
    </div>
  );
};

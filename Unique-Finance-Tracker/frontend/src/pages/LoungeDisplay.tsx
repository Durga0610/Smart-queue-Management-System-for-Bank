import { useParams } from "wouter";
import { useGetLoungeDisplay } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Activity, Clock, Users, ArrowRight } from "lucide-react";

export default function LoungeDisplay() {
  const { id } = useParams();
  const branchId = Number(id);

  const { data: display, isLoading } = useGetLoungeDisplay(branchId, {
    query: { refetchInterval: 3000 }
  });

  if (isLoading || !display) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  const { branch, nowServing, upcoming } = display;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 overflow-hidden font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
            <Activity className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">{branch.name}</h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm opacity-60">Live Lounge Display</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-black tabular-nums">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-muted-foreground uppercase tracking-widest text-sm opacity-60">{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-10">
        {/* Left: Now Serving */}
        <div className="col-span-8 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-bold uppercase tracking-wider flex items-center gap-3">
              <span className="w-3 h-3 bg-primary rounded-full animate-ping" />
              Now Serving
            </h2>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-muted-foreground">
                 <Users className="w-5 h-5" />
                 <span className="font-bold">{branch.queueLength} in queue</span>
               </div>
               <div className="flex items-center gap-2 text-muted-foreground">
                 <Clock className="w-5 h-5" />
                 <span className="font-bold">~{branch.avgWaitMinutes}m wait</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {nowServing.length > 0 ? (
                nowServing.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                  >
                    <Card className="bg-[#111] border-[#222] p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Activity className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-primary font-bold uppercase tracking-widest text-sm mb-2">{b.serviceName}</div>
                        <div className="text-8xl font-black tracking-tighter mb-4 text-white">
                          {b.tokenNumber}
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                              <ArrowRight className="w-6 h-6 text-primary" />
                           </div>
                           <div className="text-2xl font-bold text-muted-foreground">Counter {Math.floor(Math.random() * branch.openCounters) + 1}</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 py-32 text-center text-muted-foreground text-3xl font-bold opacity-20 italic">
                  All counters currently available
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Upcoming */}
        <div className="col-span-4 space-y-6">
          <h2 className="text-2xl font-bold uppercase tracking-wider px-4">Upcoming Tokens</h2>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {upcoming.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-3xl"
                >
                  <div>
                    <div className="text-2xl font-black tracking-tight">{b.tokenNumber}</div>
                    <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest opacity-60">{b.serviceName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-bold">{b.timeSlot}</div>
                    {b.priority && b.priority !== 'normal' && (
                      <div className="text-[10px] font-black uppercase tracking-tighter text-amber-500">{b.priority}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {upcoming.length === 0 && (
              <div className="py-20 text-center text-muted-foreground opacity-20 font-bold uppercase tracking-widest">
                No tokens booked
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Ticker */}
      <footer className="fixed bottom-0 left-0 right-0 bg-primary/5 border-t border-white/5 p-4 overflow-hidden">
        <motion.div 
          animate={{ x: [2000, -2000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap flex gap-20 items-center"
        >
          <span className="text-primary font-bold">WELCOME TO UNIQUE FINANCE PULSE</span>
          <span className="text-white/40">•</span>
          <span>Please have your documents ready for faster service</span>
          <span className="text-white/40">•</span>
          <span className="text-primary font-bold">USE OUR MOBILE APP TO SKIP THE LINE</span>
          <span className="text-white/40">•</span>
          <span>Thank you for your patience</span>
        </motion.div>
      </footer>
    </div>
  );
}

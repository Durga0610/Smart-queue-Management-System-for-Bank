import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";

export default function NotificationsTest() {
  const { toast } = useToast();
  
  // Email state
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isEmailing, setIsEmailing] = useState(false);

  // Call state
  const [callTo, setCallTo] = useState("");
  const [callMessage, setCallMessage] = useState("");
  const [isCalling, setIsCalling] = useState(false);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailing(true);
    
    try {
      const response = await fetch("/api/notifications/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          text: emailBody,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to send email");
      
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      
      setEmailSubject("");
      setEmailBody("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsEmailing(false);
    }
  };

  const handleMakeCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalling(true);
    
    try {
      const response = await fetch("/api/notifications/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: callTo,
          message: callMessage,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to initiate call");
      
      toast({
        title: "Success",
        description: "Call initiated successfully",
      });
      
      setCallMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Test Notifications</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Email Test Card */}
          <Card>
            <CardHeader>
              <CardTitle>Send Email</CardTitle>
              <CardDescription>Test sending an email notification via Nodemailer.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailTo">To Email</Label>
                  <Input 
                    id="emailTo" 
                    type="email" 
                    value={emailTo} 
                    onChange={(e) => setEmailTo(e.target.value)} 
                    placeholder="user@example.com" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailSubject">Subject</Label>
                  <Input 
                    id="emailSubject" 
                    value={emailSubject} 
                    onChange={(e) => setEmailSubject(e.target.value)} 
                    placeholder="Test Subject" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailBody">Message</Label>
                  <Textarea 
                    id="emailBody" 
                    value={emailBody} 
                    onChange={(e) => setEmailBody(e.target.value)} 
                    placeholder="Hello from QueueLess!" 
                    required 
                  />
                </div>
                <Button type="submit" disabled={isEmailing}>
                  {isEmailing ? "Sending..." : "Send Email"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Call Test Card */}
          <Card>
            <CardHeader>
              <CardTitle>Make Phone Call</CardTitle>
              <CardDescription>Test making a phone call via Twilio.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMakeCall} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="callTo">Phone Number (E.164)</Label>
                  <Input 
                    id="callTo" 
                    type="tel" 
                    value={callTo} 
                    onChange={(e) => setCallTo(e.target.value)} 
                    placeholder="+12345678900" 
                    required 
                  />
                  <p className="text-xs text-muted-foreground">Must include country code, e.g., +1 for US</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callMessage">Voice Message</Label>
                  <Textarea 
                    id="callMessage" 
                    value={callMessage} 
                    onChange={(e) => setCallMessage(e.target.value)} 
                    placeholder="Hello, this is a test call from QueueLess." 
                    required 
                  />
                </div>
                <Button type="submit" disabled={isCalling}>
                  {isCalling ? "Calling..." : "Make Call"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

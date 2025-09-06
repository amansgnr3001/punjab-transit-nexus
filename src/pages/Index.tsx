import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Truck, Users, Building2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold text-primary">
              Punjab Government Transportation Portal
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Welcome to Punjab Transport System
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your portal to access the transportation management system
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Customer Portal */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Customer Portal</CardTitle>
              <CardDescription>
                Plan your journey with our bus services
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => navigate('/customer')}
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary"
              >
                Access Customer Portal
              </Button>
            </CardContent>
          </Card>

          {/* Driver Portal */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-secondary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Truck className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle className="text-xl">Driver Portal</CardTitle>
              <CardDescription>
                Manage your routes and journeys
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => navigate('/driver')}
                variant="secondary"
                className="w-full"
              >
                Access Driver Portal
              </Button>
            </CardContent>
          </Card>

          {/* Municipality Portal */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-government-green/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-government-green/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-government-green/20 transition-colors">
                <Building2 className="w-8 h-8 text-government-green" />
              </div>
              <CardTitle className="text-xl">Municipality Portal</CardTitle>
              <CardDescription>
                Administrative management system
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => navigate('/municipality')}
                style={{ backgroundColor: 'hsl(var(--government-green))', color: 'white' }}
                className="w-full hover:opacity-90"
              >
                Access Municipality Portal
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
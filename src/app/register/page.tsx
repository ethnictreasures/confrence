import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Briefcase, Users, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TC</span>
            </div>
            <span className="font-semibold text-xl text-gray-900">Tech Conference 2025</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Registration Type Selection */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Select Your Registration Type
          </h1>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Choose the category that best describes you to begin your registration process.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/register/student">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-blue-500">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle>Student</CardTitle>
                  <CardDescription>For students currently enrolled in academic programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Registration Fee</span>
                      <span className="font-semibold text-gray-900">₹1,500</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Document Required</span>
                      <span className="font-semibold text-gray-900">Student ID</span>
                    </div>
                  </div>
                  <Button className="w-full">Select Student</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/register/industry">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-blue-500">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Briefcase className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle>Industry Professional</CardTitle>
                  <CardDescription>For working professionals and industry experts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Registration Fee</span>
                      <span className="font-semibold text-gray-900">₹3,000</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Document Required</span>
                      <span className="font-semibold text-gray-900">Professional ID</span>
                    </div>
                  </div>
                  <Button className="w-full">Select Professional</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/register/other">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-blue-500">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle>Other Participant</CardTitle>
                  <CardDescription>For researchers, academics, and other attendees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Registration Fee</span>
                      <span className="font-semibold text-gray-900">₹2,000</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Document Required</span>
                      <span className="font-semibold text-gray-900">Optional</span>
                    </div>
                  </div>
                  <Button className="w-full">Select Other</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

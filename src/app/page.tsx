import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Briefcase, Users, Calendar, MapPin, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TC</span>
            </div>
            <span className="font-semibold text-xl text-gray-900">Tech Conference 2025</span>
          </div>
          <Link href="/admin">
            <Button variant="ghost" size="sm">Admin</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Tech Conference 2025
          </h1>
          <p className="text-2xl text-blue-600 font-medium mb-4">
            Innovation, Learning, and Networking
          </p>
          <div className="flex items-center justify-center gap-6 text-gray-600 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>March 15-17, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>Convention Center, Bangalore</span>
            </div>
          </div>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Join us for three days of inspiring talks, workshops, and networking opportunities with industry leaders and innovators from around the world.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Register Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-white">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Attend?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Network with Experts</h3>
            <p className="text-gray-600">Connect with industry leaders, researchers, and fellow professionals from diverse backgrounds.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Learn from the Best</h3>
            <p className="text-gray-600">Attend workshops and sessions led by renowned experts in technology and innovation.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Career Opportunities</h3>
            <p className="text-gray-600">Discover new career paths, job opportunities, and potential collaborations.</p>
          </div>
        </div>
      </section>

      {/* Registration Categories */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Choose Your Registration Type
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Select the category that best describes you to begin your registration process.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Link href="/register/student">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-blue-500">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Student</CardTitle>
                <CardDescription>For students currently enrolled in academic programs</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Special student pricing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Access to all sessions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Networking opportunities</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Button className="w-full">Register as Student</Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/register/industry">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-blue-500">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Industry Professional</CardTitle>
                <CardDescription>For working professionals and industry experts</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Full conference access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Exclusive workshops</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Premium networking</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Button className="w-full">Register as Professional</Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/register/other">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-blue-500">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Other Participant</CardTitle>
                <CardDescription>For researchers, academics, and other attendees</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Flexible registration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Conference materials</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Digital proceedings</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Button className="w-full">Register as Other</Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Important Information */}
      <section className="container mx-auto px-4 py-16 bg-gray-50">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Important Information
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">Document Requirements</h3>
            <p className="text-gray-600">Students must upload a valid student ID card. Industry professionals must provide proof of employment or professional identity. Other participants may need to upload supporting documents based on their category.</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">Payment Process</h3>
            <p className="text-gray-600">After submitting your registration, you will receive a payment link. Complete the payment to finalize your registration. Your registration will be verified after document review and payment confirmation.</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">Verification Timeline</h3>
            <p className="text-gray-600">Document verification typically takes 2-3 business days. You will receive an email confirmation once your registration is approved.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TC</span>
            </div>
            <span className="font-semibold text-xl">Tech Conference 2025</span>
          </div>
          <p className="text-gray-400 mb-4">
            Innovation, Learning, and Networking
          </p>
          <p className="text-gray-500 text-sm">
            © 2025 Tech Conference. All rights reserved.
          </p>
        </div>
      </footer> */}
    </div>
  );
}

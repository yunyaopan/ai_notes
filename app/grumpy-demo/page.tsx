import { GrumpyFaceDemo } from '@/components/grumpy-face-demo';

export default function GrumpyDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Grumpy Face Selector Demo
          </h1>
          <p className="text-gray-600">
            Interactive emotion intensity selector using the grumpy face
          </p>
        </div>
        
        <GrumpyFaceDemo />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This component can be integrated into your text categorizer or any other UI
          </p>
        </div>
      </div>
    </div>
  );
}

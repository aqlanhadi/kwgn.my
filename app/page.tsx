import { FileDropzone } from "@/components/FileDropzone";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            File Processor
          </h1>
          <p className="text-slate-600 text-lg">
            Drop your files here to get started
          </p>
        </div>
        <FileDropzone />
      </div>
    </div>
  );
}

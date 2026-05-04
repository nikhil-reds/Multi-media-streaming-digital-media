import FileUpload from "@/components/FileUpload";

export default function Page() {
  return (
    <section className="flex flex-col items-center px-6 py-16 gap-10">
      <div className="text-center max-w-xl flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight text-black">
          Upload Your Documents
        </h1>
        <p className="text-gray-500 text-base leading-relaxed">
          Select one or more files to get started. Supports PDF, images, and videos.
          Your files are processed securely and instantly.
        </p>
      </div>

      <FileUpload />
    </section>
  );
}

import React from "react";

interface FileUploadButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  id?: string;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFilesSelected,
  label = "Add More File",
  id = "add-files",
  accept,
  ...props
}) => (
  <>
    <label
      htmlFor={id}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
    >
      {label}
    </label>
    <input
      id={id}
      type="file"
      onChange={onFilesSelected}
      accept={accept}
      className="hidden"
      {...props}
    />
  </>
); 
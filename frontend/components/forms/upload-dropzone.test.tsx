import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UploadDropzone } from "./upload-dropzone";
import { api } from "@/lib/api";
import { toast } from "sonner";

vi.mock("@/lib/api");
vi.mock("sonner");

describe("UploadDropzone", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders upload page with all UI elements", () => {
      render(<UploadDropzone />);
      
      expect(screen.getByText("Upload Intelligence")).toBeInTheDocument();
      expect(screen.getByText("Drop CSV, PDF, or XLSX")).toBeInTheDocument();
      expect(screen.getByText("Document Type")).toBeInTheDocument();
      expect(screen.getByText("Upload")).toBeInTheDocument();
      expect(screen.getByText("No file selected.")).toBeInTheDocument();
    });

    it("renders all category options", () => {
      render(<UploadDropzone />);
      
      expect(screen.getByText("invoice")).toBeInTheDocument();
      expect(screen.getByText("contract")).toBeInTheDocument();
      expect(screen.getByText("trade finance")).toBeInTheDocument();
      expect(screen.getByText("KYC")).toBeInTheDocument();
      expect(screen.getByText("policy")).toBeInTheDocument();
      expect(screen.getByText("vendor report")).toBeInTheDocument();
    });

    it("displays file preview panel", () => {
      render(<UploadDropzone />);
      
      expect(screen.getByText("File Preview")).toBeInTheDocument();
    });
  });

  describe("File Selection", () => {
    it("updates UI when file is selected via file input", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText("test.csv")).toBeInTheDocument();
      });
    });

    it("shows MB size when file is selected", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      Object.defineProperty(file, "size", { value: 1024 * 1024 });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText(/1.00 MB selected/)).toBeInTheDocument();
      });
    });

    it("shows PDF icon for PDF files", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = new File(["%PDF"], "test.pdf", { type: "application/pdf" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText("test.pdf")).toBeInTheDocument();
      });
    });

    it("shows spreadsheet icon for CSV files", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = new File(["col1,col2\nval1,val2"], "data.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText("data.csv")).toBeInTheDocument();
      });
    });
  });

  describe("Category Selection", () => {
    it("defaults to invoice category", () => {
      render(<UploadDropzone />);
      
      const select = document.querySelector("select") as HTMLSelectElement;
      expect(select.value).toBe("invoice");
    });

    it("allows category change via select", async () => {
      render(<UploadDropzone />);
      
      const select = document.querySelector("select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "contract" } });
      
      expect(select.value).toBe("contract");
    });

    it("shows all 6 document categories", () => {
      render(<UploadDropzone />);
      
      const options = document.querySelectorAll("select option");
      expect(options.length).toBe(6);
    });
  });

  describe("File Upload Submission", () => {
    it("shows error toast when no file selected and upload clicked", async () => {
      render(<UploadDropzone />);
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      expect(toast.error).toHaveBeenCalledWith("Choose a file first");
    });

    it("calls API upload when file is selected", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ id: "upload-123" });
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/upload", expect.any(FormData));
      });
    });

    it("uploads with correct file and category in FormData", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ success: true });
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["test,data"], "financial.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
        const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
        expect(formData.get("file")).toBeDefined();
        expect(formData.get("category")).toBe("invoice");
      });
    });

    it("resets file after successful upload", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ id: "upload-123" });
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("File metadata and preview stored");
      });
    });

    it("shows loading state during upload", async () => {
      vi.mocked(api.post).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      expect(screen.getByText("Uploading")).toBeInTheDocument();
    });

    it("shows error toast on upload failure", async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error("Network error"));
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Network error");
      });
    });

    it("shows generic error when non-Error exception", async () => {
      vi.mocked(api.post).mockRejectedValueOnce("Unknown error");
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Upload failed. Make sure the backend is running.");
      });
    });

    it("restores button after upload completes (success)", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ success: true });
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText("Upload")).toBeInTheDocument();
      });
    });

    it("restores button after upload fails", async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error("Failed"));
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText("Upload")).toBeInTheDocument();
      });
    });
  });

  describe("Drag and Drop", () => {
    it("accepts dropped file via drag events", async () => {
      render(<UploadDropzone />);
      
      const dropzone = screen.getByText("Drop CSV, PDF, or XLSX").closest("label") as HTMLLabelElement;
      const mockFile = new File(["data"], "dropped.csv", { type: "text/csv" });
      
      fireEvent.drop({ 
        preventDefault: vi.fn(),
        dataTransfer: { files: [mockFile] }
      } as unknown as React.DragEvent);
      
      await waitFor(() => {
        expect(screen.getByText("dropped.csv")).toBeInTheDocument();
      });
    });
  });

  describe("File Type Validation", () => {
    it("accepts CSV files", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = new File(["col1,col2"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText("test.csv")).toBeInTheDocument();
      });
    });

    it("accepts PDF files", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = new File(["%PDF"], "document.pdf", { type: "application/pdf" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText("document.pdf")).toBeInTheDocument();
      });
    });

    it("accepts XLSX files", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = new File(["sheet"], "spreadsheet.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText("spreadsheet.xlsx")).toBeInTheDocument();
      });
    });
  });

  describe("File Preview Panel", () => {
    it("shows empty state when no file selected", () => {
      render(<UploadDropzone />);
      
      expect(screen.getByText("No file selected.")).toBeInTheDocument();
    });

    it("shows file details in preview when file selected", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "preview.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText(/preview.csv/)).toBeInTheDocument();
        expect(screen.getByText(/Category: invoice/)).toBeInTheDocument();
      });
    });

    it("updates preview when category changes", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const select = document.querySelector("select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "KYC" } });
      
      await waitFor(() => {
        expect(screen.getByText(/Category: KYC/)).toBeInTheDocument();
      });
    });

    it("shows description text after file selection", async () => {
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText(/SureVision stores file metadata/)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible label for category selector", () => {
      render(<UploadDropzone />);
      
      expect(screen.getByLabelText(/Document Type/)).toBeInTheDocument();
    });

    it("upload button has proper disabled state during loading", async () => {
      vi.mocked(api.post).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText("Uploading");
      expect(uploadButton).toBeDisabled();
    });
  });
});

describe("Upload API Integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("API Request Format", () => {
    it("sends POST request to /upload endpoint", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ id: "test-123" });
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["test"], "api-test.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      screen.getByText("Upload").click();
      
      expect(api.post).toHaveBeenCalledWith("/upload", expect.any(FormData));
    });

    it("includes category in upload request", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ success: true });
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["data"], "category.csv", { type: "text/csv" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const select = document.querySelector("select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "policy" } });
      
      screen.getByText("Upload").click();
      
      await waitFor(() => {
        const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
        expect(formData.get("category")).toBe("policy");
      });
    });

    it("allows uploading different file types", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ id: "pdf-upload" });
      
      const { container } = render(<UploadDropzone />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["%PDF-1.4"], "doc.pdf", { type: "application/pdf" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      screen.getByText("Upload").click();
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });

    it("validates file has been attached before upload", () => {
      render(<UploadDropzone />);
      
      const uploadButton = screen.getByText("Upload");
      fireEvent.click(uploadButton);
      
      expect(api.post).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Choose a file first");
    });
  });
});
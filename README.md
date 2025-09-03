# kwgn.my

A lightweight web app that converts PDF bank statements to CSV using the [kwgn CLI tool](https://github.com/aqlanhadi/kwgn-cli).

## Features

### 📄 Simple PDF to CSV Conversion

- **Drag & Drop Interface**: Upload PDF bank statements by dragging files or clicking to browse
- **Automatic Processing**: Uses the kwgn CLI tool to extract transaction data
- **CSV Export**: Download processed transactions as CSV files
- **Transaction Preview**: See a quick preview of the first few transactions before downloading
- **Multi-file Support**: Process multiple statement files at once

### 🔒 Privacy-First Design

- **No File Storage**: Files are processed server-side and immediately deleted
- **Anonymized Analytics**: Only tracks the total number of statements processed
- **Client-side Processing**: No sensitive data sent to external servers

### 🏦 Supported Banks

- **Maybank**: Savings, Current, and Credit Card statements
- **Touch 'n Go**: e-wallet statements

## Getting Started

### Prerequisites

1. **Node.js**: Version 18 or higher
2. **pnpm**: Package manager (or npm/yarn)
3. **kwgn CLI**: The app expects the kwgn binary to be available in the system PATH

### Installation

1. Clone this repository:

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload Files**: Drag and drop PDF bank statements onto the dropzone or click to browse
2. **Wait for Processing**: The app will show progress as it processes your files
3. **Download CSV**: Once processing is complete, download your transaction data as CSV
4. **Process More**: Click "Extract more" to process additional files

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with Motion animations
- **Processing**: kwgn CLI tool for PDF parsing
- **Deployment**: Docker container with multi-stage build

## Development

### Project Structure

```
kwgn-ui-min/
├── app/                 # Next.js app router
│   ├── actions.ts      # Server actions for file processing
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page with file upload
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── FileDropzone.tsx # Drag & drop file interface
├── lib/               # Utility libraries
│   ├── analytics.ts   # Plausible analytics integration
│   ├── csv.ts        # CSV generation utilities
│   └── kwgn/         # kwgn CLI integration
└── public/           # Static assets
```

### Docker Deployment

The app includes a Dockerfile for containerized deployment:

```bash
# Build the Docker image
docker build --build-arg GITHUB_TOKEN=your_token -t kwgn-ui .

# Run the container
docker run -p 3000:3000 kwgn-ui
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [kwgn CLI](https://github.com/aqlanhadi/kwgn-cli) - The underlying tool that does the heavy lifting
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Next.js](https://nextjs.org/) - The React framework
- [Motion](https://motion.dev/) - Animation library

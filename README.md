# kwgn UI

A Next.js web interface for the [kwgn](https://github.com/aqlanhadi/kwgn-cli) CLI tool, providing an intuitive way to extract and visualize transaction data from bank statements.

## Features

### 🏦 Transaction Extraction

- Upload PDF bank statements from supported banks
- Automatic processing using the kwgn CLI tool
- Support for multiple statement types (Maybank CASA/MAE, Maybank Credit Card, Touch 'n Go)

### 📊 Transaction Table

- **Beautiful tabular display** of extracted transactions with sortable columns
- **Summary cards** showing account details, totals, and net amounts
- **Advanced filtering** by transaction type (credit/debit) and account
- **Search functionality** across descriptions, references, and account names
- **Export to CSV** for further analysis in Excel or other tools
- **Multi-file support** - combine transactions from multiple statements

### 🎨 Modern UI

- Built with Next.js 15 and React 19
- Styled with Tailwind CSS and shadcn/ui components
- Responsive design that works on desktop and mobile
- Professional Malaysian Ringgit (MYR) currency formatting

## Getting Started

### Prerequisites

1. **kwgn CLI Tool**: Install the [kwgn CLI](https://github.com/aqlanhadi/kwgn-cli) tool on your system
2. **Node.js**: Version 18 or higher
3. **pnpm**: Package manager (or npm/yarn)

### Installation

1. Clone this repository:

```bash
git clone <repository-url>
cd kwgn-ui
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and set the path to your kwgn configuration:

```
kwgn_CONFIG_PATH=/path/to/your/kwgn/config.toml
```

4. Start the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Processing Bank Statements

1. **Upload Files**: Drag and drop or select PDF bank statements on the home page
2. **Automatic Processing**: Files are automatically processed when you navigate to the transactions page
3. **View Results**: See the extracted transaction data in a beautiful table format

### Transaction Table Features

#### Summary Cards

- **Account Information**: View account name, number, and type
- **Financial Summary**: Total credits, debits, and net amount
- **Transaction Count**: Number of transactions per file

#### Table Controls

- **Sorting**: Click column headers to sort by sequence, date, type, or amount
- **Search**: Use the search bar to find specific transactions by description, reference, or account
- **Filtering**: Filter by transaction type (credit/debit) or specific account
- **Export**: Download filtered results as CSV for external analysis

#### Table Columns

- **Sequence**: Transaction sequence number from the statement
- **Date**: Transaction date with proper formatting
- **Description**: Transaction descriptions (may be multiple lines)
- **Type**: Credit or Debit with color-coded badges
- **Amount**: Transaction amount in MYR with proper formatting
- **Balance**: Account balance after the transaction
- **Reference**: Transaction reference number
- **Account**: Account name and number

### Supported Statement Types

The app currently supports:

- **Maybank CASA & MAE**: Current and savings accounts
- **Maybank Credit Card**: Credit card statements
- **Touch 'n Go**: e-wallet statements

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Processing**: kwgn CLI tool integration
- **State Management**: React hooks and Context
- **File Handling**: Server-side processing with temporary files

## Development

### Project Structure

```
kwgn-ui/
├── app/                 # Next.js app router pages
│   ├── actions.ts      # Server actions for file processing
│   ├── page.tsx        # Home page with file upload
│   └── transactions/   # Transaction viewing page
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── FileDropzone.tsx
│   └── TransactionTable.tsx
├── lib/
│   ├── kwgn/          # kwgn CLI integration
│   └── utils.ts       # Utility functions
└── public/            # Static assets
```

### Adding New Statement Types

To add support for new bank statement types:

1. Update the `extract` function in `lib/kwgn/index.ts` to include the new type
2. Modify the `processFiles` action in `app/actions.ts` to handle the new type
3. The transaction table will automatically work with any statement type that follows the kwgn output format

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful and accessible UI components
- [Next.js](https://nextjs.org/) - The React framework for production

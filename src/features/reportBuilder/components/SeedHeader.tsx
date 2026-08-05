import './SeedHeader.css'

type SeedHeaderProps = {
  sheetName: string
  onSheetNameChange: (nextValue: string) => void
}

function SeedHeader({ sheetName, onSheetNameChange }: SeedHeaderProps) {
  return (
    <header className="seed-header">
      <h1>Flex Reports Seed Playground</h1>
      <p>
        Billing-style mock data is loaded from JSON so we can build and test
        reports without a database.
      </p>
      <div className="seed-header-sheet-name">
        <label htmlFor="sheet-name-input">Sheet name</label>
        <input
          id="sheet-name-input"
          type="text"
          value={sheetName}
          onChange={(event) => {
            onSheetNameChange(event.target.value)
          }}
          placeholder="Sample rows"
        />
      </div>
    </header>
  )
}

export default SeedHeader

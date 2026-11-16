import ReportBuilderApp from './features/reportBuilder/ReportBuilderApp'
import type { ReportBuilderAppProps } from './features/reportBuilder/types'

// The local demo: the builder in sandbox mode, on built-in sample data.
function App(props: ReportBuilderAppProps) {
  return <ReportBuilderApp sandbox {...props} />
}

export default App

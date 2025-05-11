// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import './index.css'
import App from './App.tsx'
import BlockchainGraph from './BlockchainGraph.tsx';


// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

createRoot(document.getElementById('root')!).render(
  <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/visualizer" element={<BlockchainGraph />} />
      </Routes>
  </Router>
)
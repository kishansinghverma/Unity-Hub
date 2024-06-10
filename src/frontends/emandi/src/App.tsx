import 'react-toastify/dist/ReactToastify.css';
import 'semantic-ui-css/semantic.min.css'
import './App.css';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom';
import { RouterPage } from './pages/router';

function App() {
  return (
    <div className='page'>
      <ToastContainer />
      <BrowserRouter>
        <RouterPage />
      </BrowserRouter>
    </div>
  );
}

export default App;

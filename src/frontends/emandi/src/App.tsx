import 'react-toastify/dist/ReactToastify.css';
import 'semantic-ui-css/semantic.min.css'
import './App.css';
import { ToastContainer } from 'react-toastify';
import { MainPage } from './pages/mainpage';

function App() {
  return (
    <div className='page'>
      <ToastContainer />
      <MainPage />
    </div>
  );
}

export default App;

import { Link } from 'react-router-dom'

//import scss
import './Error.scss'


function Erorr() {
  return (
    <div className='container-erorr'>
      <p className='num-erorr'>404</p>
      <p className='description-erorr'>Oups! La page que vous demandez n'existe pas.</p>
      <Link className='styled-link-erorr' to="/home">Retourner sur la page d’accueil</Link>
    </div>
  )
}

export default Erorr

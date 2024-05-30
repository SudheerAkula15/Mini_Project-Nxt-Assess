import Cookies from 'js-cookie'
import {withRouter, Link} from 'react-router-dom'

import './index.css'

const Header = props => {
  const onClickLogout = () => {
    const {history} = props
    Cookies.remove('jwt_token')
    history.replace('/login')
  }

  return (
    <nav className="nav-container">
      <div className="item-container">
        <Link to="/">
          <img
            src="https://res.cloudinary.com/dzaz9bsnw/image/upload/v1704821765/Group_8005_vgjmvh.jpg"
            alt="website logo"
            className="image"
          />
        </Link>
      </div>
      <Link to="/login">
        <button onClick={onClickLogout} type="button" className="logOutButton">
          Logout
        </button>
      </Link>
    </nav>
  )
}

export default withRouter(Header)

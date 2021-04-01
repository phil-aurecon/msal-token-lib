/* eslint-disable */
import React, { useState, useEffect } from 'react'
import * as msal from '@azure/msal-browser'

export const TokenComponent = (props: any): JSX.Element => {
  const { config } = props

  const [token, setToken] = useState<string>()
  const [name, setName] = useState<string>()

  const localToken = window.localStorage.getItem('AccessToken')
  if (!token && localToken) {
    const tkn = window.localStorage.getItem('AccessToken') || ''
    setToken(tkn)
  }

  const msalConfig: any = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      redirectUri: config.redirectUri,
    },
  }

  const [msalInstance] = useState(new msal.PublicClientApplication(msalConfig))

  useEffect(() => {
    if (!token) {
      console.log('Token Signin')
      const handleResponse = (resp: any) => {
        let accountId
        if (resp !== null) {
          accountId = resp.account.homeAccountId
          window.localStorage.setItem('AccessToken', resp.accessToken)
          setToken(resp.accessToken)
          const decoded = JSON.parse(atob(resp.accessToken.split('.')[1]))
          if(decoded.name) {
            setName(decoded.name)
          }
        } else {
          // need to call getAccount here?
          const currentAccounts = msalInstance.getAllAccounts()
          if (!currentAccounts || currentAccounts.length < 1) {
            return
          } else if (currentAccounts.length > 1) {
            // Add choose account code here
          } else if (currentAccounts.length === 1) {
            accountId = currentAccounts[0].homeAccountId
          }
        }
      }
      msalInstance
        .handleRedirectPromise()
        .then(handleResponse)
        .catch((err: string) => {
          console.error(err)
        })
    } else {
      //Check expiry
      const tokenData = JSON.parse(atob(token.split('.')[1]))
      if (tokenData.exp < Math.round(Date.now() / 1000)) {
        console.log('Access token expired')
        window.localStorage.setItem('AccessToken', '')
        setToken('')
        setName('')
      } else if(tokenData.name) {
        setName(tokenData.name)
      }
    }
  }, [token])

  const signIn = () => {
    const loginRequest = {
      scopes: config.scopes, // optional Array<string>
    }

    try {
      msalInstance.loginRedirect(loginRequest)
    } catch (err) {
      // handle error
    }
  }

  return token ? (
    <div>{name}</div>
  ) : (
    <button className={'button is-small is-text is-navbar'} onClick={signIn}>
      Log In
    </button>
  )
}

export default TokenComponent

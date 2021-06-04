
import React, { useState, useEffect } from 'react'
import * as msal from '@azure/msal-browser'

const LOGGING_IN = 'msal-logging-in'
const ACCESS_TOKEN = 'AccessToken'

export const TokenComponent = (props: any): JSX.Element => {
  const { config, automaticlogin,cssClass } = props

  const [token, setToken] = useState<string>()
  const [name, setName] = useState<string>()  
  const [account,setAccount] = useState<any>()
  
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
        async function getToken(){
            if (!token) {      
                const handleResponse =(resp: any) => {          
                    let accountId
                    if (resp !== null) {        
                        accountId = resp.account.homeAccountId
                        window.localStorage.removeItem(LOGGING_IN)
                        window.localStorage.setItem(ACCESS_TOKEN, resp.accessToken)                    
                        setToken(resp.accessToken)
                        const decoded = JSON.parse(atob(resp.accessToken.split('.')[1]))
                        if(decoded.name) {
                            setName(decoded.name)
                        }
                        setAccount(resp.account)
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
                if(automaticlogin){
                    signIn()
                }
            } else {
            //Check expiry
            const tokenData = JSON.parse(atob(token.split('.')[1]))
            if (tokenData.exp < Math.round(Date.now() / 1000)) {
                console.log('Access token expired')
                window.localStorage.removetItem(ACCESS_TOKEN)                
                setToken('')
                //setName('')
            
                var silentRequest = {
                    scopes: config.scopes,
                    account: account,
                    forceRefresh: false
                };
                const resp = await msalInstance.acquireTokenSilent(silentRequest).catch(error => {    
                    var request = {
                        scopes: config.scopes,
                        loginHint: account.username // For v1 endpoints, use upn from idToken claims
                    };                       
                    return msalInstance.acquireTokenRedirect(request)                
                })
                if(resp){
                    setToken(resp.accessToken)                    
                }        
            } else if(tokenData.name) {
                setName(tokenData.name)
            }
            }
        }
        getToken()
  }, [token])

  const signIn = () => {
    const loginRequest = {
      scopes: config.scopes, // optional Array<string>
    }    
    try {
        const loggingIn = window.localStorage.getItem(LOGGING_IN)
        if(loggingIn===null){            
            window.localStorage.setItem(LOGGING_IN,"true")
            msalInstance.loginRedirect(loginRequest)
            
        }
    } catch (err) {
      // handle error
    }
  }

  return token ? (
    <div>{name}</div>
  ) : (
    <button className={cssClass} onClick={signIn}>
      Log In
    </button>
  )
}

export default TokenComponent

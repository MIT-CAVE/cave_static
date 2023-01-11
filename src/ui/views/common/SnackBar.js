import { Snackbar, IconButton } from '@mui/material'
import * as React from 'react'
import { AiFillCloseCircle } from 'react-icons/ai'
import { useDispatch } from 'react-redux'

import { removeMessage } from '../../../data/utilities/messagesSlice'

const SnackBar = ({ message, messageKey }) => {
  console.log(message)
  const dispatch = useDispatch()
  //   const handleClose = (key) => {
  //     console.log("Closing")

  // }

  const ClosingButton = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={() => dispatch(removeMessage({ messageKey: messageKey }))}
      >
        <AiFillCloseCircle fontSize="small" />
      </IconButton>
    </React.Fragment>
  )

  return (
    <Snackbar
      // autoHideDuration= {firstMessage.duration*1000}
      open={true}
      // onClose={handleClose}
      message={message}
      action={ClosingButton}
    ></Snackbar>
  )
}
export default SnackBar

//   const SingleAlert = ({alert,key}) => {
//       <Snackbar
//         // autoHideDuration= {firstMessage.duration*1000}
//         open= {true}
//         // onClose={handleClose}
//         message = {alert.message}
//         action = {<ClosingButton  messageKey={key}/>}
//       ></Snackbar>

//   }

//   const filteredMessages = () => {
//     for (let i = 0; i < Object.keys(messages).length; i++){
//       if (R.path([i,'snackbarShow'], messages) !== true){
//         R.dissoc(i,messages)
//       }
//     }
//   }
//   // filteredMessages()
//   let to_show = null

//   if (Object.keys(messages).length != 0){
//     filteredMessages()
//     let keys = R.keys(messages)

//     to_show = <SingleAlert alert = {messages[1]} key= {1}/>
//     // to_show = keys.map((key) =>(
//     //   console.log(key)
//     // ))
//     // to_show = (
//     //   <SnackBar

//     //   open={true}
//     //   message = {messages[0].message}
//     //   >
//     //   </SnackBar>
//     // )
//     // to_show = singleAlert(messages[keys[0]],keys[0])
//   }

//   //   to_show = keys.map((key) => (

//   //   singleAlert(messages[key],key)))
//   // }

//   return(
//     <div>
//       {to_show}
//     </div>
//   )
// }

//   const getfirsttoShow = (list) =>{
//     for (let i = 0; i < Object.keys(list).length; i++){
//       if (Object.values(list)[i].snackbarShow === true){
//         return [Object.values(list)[i], i]
//       }

//     }
//     let val = Object()
//     return [val,0]

//   }

//   let [firstMessage, messageKey] = getfirsttoShow(messages)
//   // console.log(firstMessage)
//   let exists = false
//   if (Object.keys(firstMessage).length === 0){
//     exists = false
//   }
//   else{
//     exists = true
//   }

//   return (
//     <Snackbar

//       // autoHideDuration= {firstMessage.duration*1000}
//       open={exists}
//       onClose={handleClose}
//       message = {firstMessage.message}
//       action = {action}
//     ></Snackbar>
//   )
// }

// if (Object.keys(messages).length === 0){
//   exists = false
// }else{

//   exists = true
// }

// 1:
// duration
// :
// 5
// message
// :
// "Test Exception!"
// snackbarShow
// :
// true
// snackbarType
// :
// "error"
// traceback
// :
// "Traceback (most recent call last):\n  File \"/Users/jeanbi

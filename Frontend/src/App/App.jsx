import './App.css'
import Editor from '@monaco-editor/react'
import {MonacoBinding} from 'y-monaco'
import {useRef,useMemo,useState,useEffect} from "react"
import * as Y from  'yjs'
import {SocketIOProvider} from "y-socket.io"

function App() {

    const [UserName, setUserName] = useState(()=>{
        return new URLSearchParams(window.location.search).get('userName') || ""
    })
    const [users, setUsers] = useState([])

    const editorRef = useRef(null)

    const ydoc = useMemo(()=> new Y.Doc(),[])
    const ytext = useMemo(()=>ydoc.getText('monaco'),[ydoc])

    const handleMount = (editor) => {
        editorRef.current = editor
    }

    useEffect(() => {
        if(UserName && editorRef.current){
            const provider = new SocketIOProvider("http://localhost:8080","monaco",ydoc,{
                autoConnect: true,
            }) // connects frontend editor to server

            provider.awareness.setLocalSteteField('user',{UserName})

            const states = Array.from(provider.awareness.getStates().values())

            console.log(states)

            setUsers(states.filter(state => state.user && state.user.username).map(state => state.user))

            provider.awareness.on("change",()=>{
                const states = Array.from(provider.awareness.getStates().values())
                setUsers(states.filter(state => state.user && state.user.username).map(state => state.user))
            })

            function handleBeforeUnload() {
                provider.awareness.setLocalStateField("user", null)
            }

            window.addEventListener("beforeunload", handleBeforeUnload)

            const monacoBinding = new MonacoBinding(
                ytext,
                editorRef.current.getModel(),
                new Set([editorRef.current]),
                provider.awareness,
            )
            return () => {
                provider.disconnect()
                window.removeEventListener("beforeunload", handleBeforeUnload)
            }
        }
    },[editorRef.current])

    const handleSave = (e) => {
        setUserName(e.target.userName.value)
        e.preventDefault()
        window.history.pushState({},"","?userName="+e.target.userName.value)
    }

    if(!UserName){
        return(
            <>
                <main className='h-screen w-full bg-black flex justify-center items-center '>
                        <form
                            className='flex flex-col gap-2  rounded-lg  '
                            onSubmit={ handleSave }
                        >
                            <input type='text'
                                   placeholder='Name'
                                   className='bg-gray-800 p-2 rounded-2xl text-white'
                                   name='userName'
                            />
                            <button type='submit' className='bg-amber-100 text-gray-500 font-bold rounded-2xl'>Join</button>
                        </form>
                </main>
            </>
        )
    }



    return(
        <>
            <main className='h-screen w-screen bg-black flex gap-2 p-2'>
                <aside
                    className="h-full w-1/4 bg-amber-50 rounded-lg "
                >
                    <h2 className="text-2xl font-bold p-4 border-b border-gray-300">Users</h2>
                    <ul className="p-4">
                        {users.map((user, index) => (
                            <li key={index} className="p-2 bg-gray-800 text-white rounded mb-2">
                                {user.username}
                            </li>
                        ))}
                    </ul>

                </aside>
                <section className='h-full w-4/5 bg-gray-400 rounded-2xl overflow-hidden    '>
                    <Editor height="90vh" defaultLanguage="javascript" defaultValue="//️HI" onMount={handleMount} />
                </section>
            </main>
        </>
    )
}

export default App

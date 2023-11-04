import type { ImageWidget } from "apps/admin/widgets.ts";
import { useState, useEffect, useRef } from "preact/hooks";
import { Secret } from "apps/website/loaders/secret.ts";


interface Props {
  secret?: Secret,
  name: string,
  /** 
   * @format color 
   * @title Base
   * @default #004080
  */
  color?: string,
  voiceTone?: "Formal" | "Casual" | "Sério" | "Prático",
  avatar?: ImageWidget,
}

const API_URL = "https://api.openai.com/v1/chat/completions"

let API_KEY = ""

export const loader = async (props: Props) => {
  const secretValue = await props?.secret?.get();
  API_KEY = secretValue as string
};

const DEFAULT_PROPS: Props = {
  name: 'Assistente Virtual',
  voiceTone: "Formal",
  avatar: 'https://cdn.icon-icons.com/icons2/1371/PNG/512/robot02_90810.png',
};

interface MessageProps {
  type: 'bot' | 'client',
  msg: string
}

function ChatbotContainer(props: Props) {
  const { name, color, avatar, voiceTone } = { ...DEFAULT_PROPS, ...props };
  const [ phase, setPhase] = useState(0)
  const [ messages, setMessages ] = useState<MessageProps[]>([])
  const [ chatOpen, setChatbotOpen ] = useState(false)
  const [ userMessage, setUserMessage ] = useState('')
  const [ loading, setIsLoading ] = useState(false)
  const buttons = [
    {
      command: "Pergunte qual tipo de vinho.",
      options: [
        "Sei exatamente que vinho procuro",
        "Tenho ideia do que quero",
        "Quero ser surpreendido"
      ]
    },
    {
      command: "Pergunte para qual ocasião será consumida o vinho.",
      options: [
      "Vinhos mais encopardos",
      "Vinhos mais secos",
      "Vinhos com mais docura",
      "Vinhos com mistura de frutas"
      ]
    },
    {
      command: "Elogie com um comentário de 1 linha sobre a escolha do usuário e pergunte sobre o tipo.",
      options: [
      "Jantar",
      "Harmonização com queijo",
      "Tomar enquanto vejo um filme",
      "Almoço"
      ]
    },
    {
      command: "Sugira apenas um vinho e finalize a conversa",
      options: [
      "Massas",
      "Carne",
      "Peixe",
      "Frango"
      ]
    },
    {
      command: "",
      options: [
      ]
    },
  ]

  const AlwaysScrollToBottom = () => {
    const chatRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => chatRef?.current?.scrollIntoView());
    return <div ref={chatRef} />;
  };

  const handleInputChange = (e: any) => {
    setUserMessage(e.target.value.trim());
  };

  const createMessageBox = (message: string, type: "bot" | "client") => {
    return { msg: message, type}
  }

  const generateResponse = (userMessage: string) => {
    setMessages(old => [...old, createMessageBox(userMessage, "client")])
    console.log("Estágio: ", buttons[phase].command)
    console.log('escolha do usuário: ', userMessage)
    const requestOptions = {
      method: 'POST',
      headers: {
        "Content-type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `O usuário escolheu ${userMessage}. ${buttons[phase].command}.`
          },
        ]
      })
    }
    setIsLoading(true)

    fetch(API_URL, requestOptions)
      .then(res => res.json())
      .then(data => {
        console.log(data)
        setMessages(old => [...old, createMessageBox(data.choices[0].message.content, "bot")])
        setPhase(oldPhase => oldPhase + 1)
      })
      .catch((error) => {
        setMessages(old => [...old, createMessageBox("Aconteceu algo inesperado.", "bot")])
        console.log(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const restartChat = () => {
    setMessages([])
    setPhase(0)
    initChat()
  }

  const handleSendMessage = () => {
    if(!userMessage) return
    console.log('Mensagem enviada:', userMessage);
    
    // Limpe a <textarea> após o envio
    setUserMessage('');
    //setMessages(old => [...old, createMessageBox(userMessage, "client")])
    
    generateResponse(userMessage)
  }

  const initChat = () => {
    setIsLoading(true)
    fetch(API_URL, {
      method: 'POST',
      headers: {
        "Content-type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Você é um assistente virtual de um e-commerce de vinhos. Seu nome é ${name}. 
            Responda as mensagens do usuário com estilo ${voiceTone} e direto.
            Se apresente.`
          },
        ]
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log(data)
        setMessages(old => [...old, createMessageBox(data.choices[0].message.content, "bot")])
      })
      .catch((error) => {
        console.log(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    initChat()
  }, [])

  return (
    <>
    <button 
      class="fixed bottom-4 right-4 z-50 rounded-full overflow-hidden p-2 w-12 h-12"
      style={{ background: color}}
      onClick={() => setChatbotOpen(!chatOpen)}
    >
      <img src={avatar} alt="Chatbot Avatar"/>
    </button>
    <div class={`fixed bottom-16 right-2 z-50 rounded-xl overflow-hidden bg-white w-[80%] max-w-[400px] max-h-[500px] shadow-md ml-4 ${chatOpen ? 'block': 'hidden'}`}>
      <header 
        class={`py-4 text-center font-bold text-white`}
        style={{ background: color}}
      >
        {name}
      </header>
      {/* chatbox */}
      <div class="h-[300px] overflow-y-auto mb-[70px]">
      <ul class="h-full px-2 first:mt-0">
        {messages.map(msg => {
          return msg.type === 'bot' ? (
            <li class="flex items-end mt-5">{/* chat ai */}
              <div 
                class="w-8 h-8 shrink-0 mr-1  leading-8 text-center rounded overflow-hidden"
                style={{ background: color}}
              >
                <img src={avatar} alt="Chatbot Avatar"/>
              </div>
              <div>
              <p class="py-3 px-4 rounded-lg rounded-bl-none bg-[#f2f2f2] text-black">
                {msg.msg}
              </p>
              <div class="flex flex-wrap gap-1 justify-end mt-2">
              {buttons[phase] ? buttons[phase].options.map(str => (
                <button class="border p-2 rounded-2xl hover:bg-slate-400" onClick={() => generateResponse(str)}>{str}</button>
              )) : <button onClick={restartChat} class="text-sm hover:underline">Reiniciar</button>}
              </div>
              </div>
            </li>
          ) : (
            <li class="flex justify-end mt-5"> {/** chat user */}
              <p 
                class="rounded-lg rounded-br-none py-3 px-4 max-w-[75%] text-white"
                style={{ background: color }}
              >
                {msg.msg}
              </p>
            </li>
          )
        })}
        {loading && <p>Pensando...</p>}
        <AlwaysScrollToBottom />
      </ul>
      </div>
      {/* chat-input */}
      <div class="absolute bottom-0 flex gap-[5px] mt-2 w-full py-1 px-5 border-t-[1px] border-t-[#ccc] "> 
        <textarea 
          placeholder="Envie uma mensagem..."
          class="border-none outline-none resize-none py-4 pr-4 w-full h-[55px]"
          style={{scrollbarWidth: 'none'}}
          value={userMessage}
          onChange={handleInputChange}
        ></textarea>
        <button onClick={handleSendMessage} disabled={loading}>
          <span class="material-symbols-outlined">
            send
          </span>
        </button>
      </div>
    </div>
    </>
  )
}

export default ChatbotContainer;
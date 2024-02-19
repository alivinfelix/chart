import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Box, Card, CardContent, Typography, Modal, Input, Divider, Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const pairAbi = [
  {
    "constant": true,
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {
        "internalType": "uint112",
        "name": "reserve0",
        "type": "uint112"
      },
      {
        "internalType": "uint112",
        "name": "reserve1",
        "type": "uint112"
      },
      {
        "internalType": "uint32",
        "name": "blockTimestampLast",
        "type": "uint32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "token0",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "token1",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

const netzTokenAddress = '0x41c515fA7D541bCbDEfB44f0FE2B1629aec140b9';

const App = () => {
  const providerUrl = 'https://mainnet-rpc.mainnetz.io/';
  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
  const [netzPrice, setNetzPrice] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [pairAddress, setpairAddress] = useState(null);
  const [tempAddress, settempAddress] = useState(null);
  const [visible, setvisible] = useState(true)
  const rootRef = React.useRef(null);
  const inuptRef = React.useRef(null);


  useEffect(() => {
    if (pairAddress != null) {
      console.log('paireAddress', pairAddress)
      const fetchData = async () => {
        try {
          if (!web3.eth.net.isListening()) {
            console.log("Failed to connect to Ethereum network");
            return;
          }

          const pairAddressNetz = '0x48d0B489f9bE6416b2b7B690DC1ac6f22352DA75';
          const lpContractNetz = new web3.eth.Contract(pairAbi, pairAddressNetz);

          const reserves = await lpContractNetz.methods.getReserves().call();

          const reserveUsdt = reserves[0]; // Assuming this is USDT
          const reserveNetz = reserves[1]; // Assuming this is NETZ

          const netzDecimals = await lpContractNetz.methods.decimals().call();

          //console.log('netzDecimals', netzDecimals)

          const pricePerNetz = parseFloat(reserveUsdt) / parseFloat(reserveNetz);
          //console.log("NetZ Price:", pricePerNetz.toFixed(4)); // Displaying price with four decimal places
          setNetzPrice(pricePerNetz);

          // Call fetchTokenPrice after fetching NETZ price
          await fetchTokenPrice();
        } catch (error) {
          console.error("Error fetching NETZ price:", error);
        }
      };

      const fetchTokenPrice = async () => {
        try {
          const pairAddressToken = pairAddress;//'0x9503fE346a959e47e80223b0dC3AAf83Ac287d6e';
          const lpContract = new web3.eth.Contract(pairAbi, pairAddressToken);
          const token0Address = await lpContract.methods.token0().call();
          const token1Address = await lpContract.methods.token1().call();

          console.log('token0', token0Address, token1Address)
          // Attempt to get the name and symbol of the pair or contract address
          let pairName, pairSymbol;
          try {
            pairName = await lpContract.methods.name().call();
            pairSymbol = await lpContract.methods.symbol().call();
          } catch (error) {
            pairName = null;
            pairSymbol = null;
          }

          // Attempt to get the name and symbol of the NETZ token
          let netzTokenName, netzTokenSymbol;
          try {
            const netzContract = new web3.eth.Contract(pairAbi, netzTokenAddress);
            netzTokenName = await netzContract.methods.name().call();
            netzTokenSymbol = await netzContract.methods.symbol().call();
          } catch (error) {
            netzTokenName = null;
            netzTokenSymbol = null;
          }

          // Attempt to get the name and symbol of the token contract
          let tokenName, tokenSymbol, totalSupply;
          try {
            let tokenContract;
            if (token0Address !== netzTokenAddress) {
              tokenContract = new web3.eth.Contract(pairAbi, token0Address);
            } else {
              tokenContract = new web3.eth.Contract(pairAbi, token1Address);
            }

            tokenName = await tokenContract.methods.name().call();
            tokenSymbol = await tokenContract.methods.symbol().call();
            totalSupply = await tokenContract.methods.totalSupply().call(); // Fetch total supply

            // Convert total supply from Wei to its actual value
            totalSupply = parseFloat(totalSupply) / (10 ** 18); // Assuming 18 decimal places

          } catch (error) {
            tokenName = null;
            tokenSymbol = null;
            totalSupply = null;
          }

          // Get reserves based on NETZ token position
          const reserves = await lpContract.methods.getReserves().call();

          let reserveNetzToken, reserveOtherToken;
          if (token0Address === netzTokenAddress) {
            reserveNetzToken = reserves[0];
            reserveOtherToken = reserves[1];
          } else if (token1Address === netzTokenAddress) {
            //[reserveToken, reserveNetz] = reserves;
            reserveOtherToken = reserves[0];
            reserveNetzToken = reserves[1];
            //console.log('reserveToken, reserveNetz+++other case', reserveToken, reserveNetz)
          } else {
            console.log("NETZ token address not found in pair");
            return null;
          }

          // console.log('111', reserveNetz, reserveToken, netzPrice)
          // const tokenPrice = parseFloat(reserveNetz) / parseFloat(reserveToken) * netzPrice;
          const tokenPrice = parseFloat(reserveNetzToken) / parseFloat(reserveOtherToken) * netzPrice;

          //console.log("Token Price:", tokenPrice.toFixed(4)); // Displaying price with four decimal places

          // Calculate market capitalization
          const marketCap = totalSupply ? tokenPrice * totalSupply : null;

          setTokenData({
            tokenPrice,
            token0Address,
            token1Address,
            pairName,
            pairSymbol,
            netzTokenName,
            netzTokenSymbol,
            tokenName,
            tokenSymbol,
            totalSupply,
            marketCap
          });
        } catch (error) {
          console.error("Error fetching token price:", error);
        }
      };

      fetchData();
    }

  }, [web3.eth, netzPrice, pairAddress]);

  const notify = () => toast("Copied to clipboard");
  
  const copyClipboard = (data) => {
    console.log('data', data)
    navigator.clipboard.writeText(data)
      .then(() => {
        console.log('Text copied to clipboard');
        notify();
      })
      .catch((error) => {
        console.error('Failed to copy text:', error)
      });
  }

  const showUserInfo = (address) => {
    let res = address.substring(0, 12) + "..." + address.substring(address.length - 6, address.length)
    return res
  }



  const formatNumber = (number) => {
    const [integerPart, decimalPart] = number.toString().split('.');

    const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const formattedNumber = decimalPart ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;

    return formattedNumber;
  };


  const handleClick = () => {
    // Access the current value of the input using inputRef.current.value
    console.log(inuptRef.current);
    setvisible(false);
    setpairAddress(tempAddress);
  };

  // if(!pairAddress)
  // {
  //   return  <Box
  //   sx={{
  //     display:'flex',
  //     justifyContent:'center',
  //     alignItems:'center',
  //     height: '100vh',
  //     flexGrow: 1,
  //     minWidth: 300,
  //     transform: 'translateZ(0)',
  //     // The position fixed scoping doesn't work in IE11.
  //     // Disable this demo to preserve the others.
  //     '@media all and (-ms-high-contrast: none)': {
  //       display: 'none',
  //     },
  //   }}
  //   ref={rootRef}
  // >
  //   <Box
  //       sx={{
  //         position: 'relative',
  //         width: 400,
  //         bgcolor: 'background.paper',
  //         border: '2px solid #000',
  //         boxShadow: (theme) => theme.shadows[5],
  //         p: 4,
  //       }}
  //     >
  //       <Typography id="server-modal-title" variant="h6" component="h2">
  //         Please input the pair address.
  //       </Typography>


  //       <Divider/>

  //       <Button variant="contained" onClick={handleClick}>Chart</Button>
  //     </Box>
  // </Box>
  // }
  // else if (!netzPrice || !tokenData) {
  //   return <div>Loading...</div>;
  // }


  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#142028' }}>
      <ToastContainer />
      <Box>
        <Box sx={{ paddingBottom: '20px' }}>
          <Input ref={inuptRef} sx={{ width: '400px', color: 'white' }} autoFocus onChange={(e) => setpairAddress(e.target.value)} placeholder='input pair address'></Input>
        </Box>



        <Box sx={{ display: 'flex', paddingBottom: '15px' }}>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', marginRight: '10px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <Box>NETZ Contract Addres</Box>
              <ContentCopyIcon onClick={() => copyClipboard(tokenData && tokenData.token0Address)} />
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              {tokenData && showUserInfo(tokenData.token0Address)}
            </Typography>
          </Box>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <Box>Token Contract Address</Box>
              <ContentCopyIcon onClick={() => copyClipboard(tokenData && tokenData.token1Address)} />
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              {tokenData && showUserInfo(tokenData.token1Address)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', paddingBottom: '15px' }}>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', marginRight: '10px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              Token Name
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              {tokenData && tokenData.tokenName}
            </Typography>
          </Box>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              Token Symbol
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              {tokenData && tokenData.tokenSymbol}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', paddingBottom: '15px' }}>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', marginRight: '10px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              Netz Price
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              ${netzPrice && netzPrice.toFixed(4)}
            </Typography>
          </Box>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              Token Price(USD)
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              ${tokenData && tokenData.tokenPrice.toFixed(4)}
            </Typography>
          </Box>
        </Box>
        
        {/* <Box sx={{ display: 'flex', paddingBottom: '15px' }}>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', marginRight: '10px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              NETZ Token Name
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              {tokenData && tokenData.netzTokenName}
            </Typography>
          </Box>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              NETZ Token Symbol
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px', width: '200px' }}>
              {tokenData && tokenData.netzTokenSymbol}
            </Typography>
          </Box>
        </Box> */}

        {/* <Box sx={{ display: 'flex', paddingBottom: '15px' }}>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', marginRight: '10px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              Pair Name
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              {tokenData && tokenData.pairName}
            </Typography>
          </Box>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', width: '200px',  borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              Pair Symbol
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              {tokenData && tokenData.pairSymbol}
            </Typography>
          </Box>
        </Box> */}

        <Box sx={{ display: 'flex', paddingBottom: '15px' }}>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', marginRight: '10px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              Total Supply
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              {tokenData && formatNumber(tokenData.totalSupply)}
            </Typography>
          </Box>
          <Box sx={{ backgroundColor: '#0b1217', padding: '8px', width: '200px', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#818ea3', fontSize: '14px', paddingBottom: '5px' }}>
              Market Capitalization
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'white', fontSize: '16px' }}>
              ${tokenData && formatNumber(tokenData.marketCap.toFixed(4))}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default App;

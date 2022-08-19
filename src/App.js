import "./App.css";
import { useState, useCallback, useEffect } from "react";

import secret from "./contracts/secrets.abi.json";
import ierc from "./contracts/ierc.abi.json";
import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";

const ERC20_DECIMALS = 18;

const contractAddress = "0xC92Fe8ED9eE9e9f2b789911428fe0B088602b165";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

function App() {
	const [contract, setcontract] = useState(null);
	const [address, setAddress] = useState(null);
	const [kit, setKit] = useState(null);
	const [cUSDBalance, setcUSDBalance] = useState(0);
	const [secrets, setSecrets] = useState([]);
	const [text, setText] = useState("");
	const [amount, setAmount] = useState("");

	const connectToWallet = async () => {
		if (window.celo) {
			try {
				await window.celo.enable();
				const web3 = new Web3(window.celo);
				let kit = newKitFromWeb3(web3);

				const accounts = await kit.web3.eth.getAccounts();
				const user_address = accounts[0];

				kit.defaultAccount = user_address;

				setAddress(user_address);
				setKit(kit);
			} catch (error) {
				console.log(error);
			}
		} else {
			console.log("Error Occurred");
		}
	};

	const getBalance = useCallback(async () => {
		try {
			const balance = await kit.getTotalBalance(address);
			const USDBalance = balance.cUSD
				.shiftedBy(-ERC20_DECIMALS)
				.toFixed(2);

			const contract = new kit.web3.eth.Contract(secret, contractAddress);
			setcontract(contract);
			setcUSDBalance(USDBalance);
		} catch (error) {
			console.log(error);
		}
	}, [address, kit]);

	const getSecrets = useCallback(async () => {
		const secretLength = await contract.methods.getSecretLength().call();
		const secrets = [];

		for (let index = 0; index < secretLength; index++) {
			let _secret = new Promise(async (resolve, reject) => {
				let secret = await contract.methods.getSecret(index).call();

				resolve({
					index: index,
					owner: secret[0],
					secretText: secret[1],
					likes: secret[2],
					dislikes: secret[3],
				});
			});
			secrets.push(_secret);
		}

		const _secrets = await Promise.all(secrets);
		setSecrets(_secrets);
	}, [contract]);

	const submitForm = async (e) => {
		e.preventDefault();
		if (!text) return;
		try {
			await contract.methods.addSecret(text).send({ from: address });
			getSecrets();
		} catch (error) {
			console.log(error);
		}
	};

	const giftAmount = async (index, _amount) => {
		if (!_amount) return;
		try {
			const cUSDContract = new kit.web3.eth.Contract(
				ierc,
				cUSDContractAddress
			);
			const amount = new BigNumber(_amount)
				.shiftedBy(ERC20_DECIMALS)
				.toString();
			await cUSDContract.methods
				.approve(contractAddress, amount)
				.send({ from: address });
			await contract.methods
				.giftOwner(amount, index)
				.send({ from: address });
			getSecrets();
			getBalance();
		} catch (error) {
			console.log(error);
		}
	};

	const likeSecret = async (index) => {
		try {
			const cUSDContract = new kit.web3.eth.Contract(
				ierc,
				cUSDContractAddress
			);
			const amount = new BigNumber(1)
				.shiftedBy(ERC20_DECIMALS)
				.toString();
			await cUSDContract.methods
				.approve(contractAddress, amount)
				.send({ from: address });
			await contract.methods.likeSecret(index).send({ from: address });
			getSecrets();
			getBalance();
		} catch (error) {
			console.log(error);
		}
	};

	const dislikeSecret = async (index) => {
		try {
			const cUSDContract = new kit.web3.eth.Contract(
				ierc,
				cUSDContractAddress
			);
			const amount = new BigNumber(1)
				.shiftedBy(ERC20_DECIMALS)
				.toString();
			await cUSDContract.methods
				.approve(contractAddress, amount)
				.send({ from: address });
			await contract.methods.dislikeSecret(index).send({ from: address });
			getSecrets();
			getBalance();
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		connectToWallet();
	}, []);

	useEffect(() => {
		if (kit && address) {
			getBalance();
		}
	}, [kit, address, getBalance]);

	useEffect(() => {
		if (contract) {
			getSecrets();
		}
	}, [contract, getSecrets]);

	return (
		<div>
			{/* ======= Header ======= */}
			<header id="header" className="fixed-top d-flex align-items-center">
				<div className="container d-flex justify-content-between">
					<div className="logo">
						<h1>
							<a href="/">Secrets</a>
						</h1>
						{/* Uncomment below if you prefer to use an image logo */}
						{/* <a href="index.html"><img src="assets/img/logo.png" alt="" class="img-fluid"></a>*/}
					</div>
					<nav id="navbar" className="navbar">
						<ul>
							<li>
								<a
									className="nav-link scrollto active"
									href="#hero"
								>
									Home
								</a>
							</li>
							<li>
								<a
									className="nav-link scrollto"
									href="#contact"
								>
									Balance: {cUSDBalance} cUSD
								</a>
							</li>
						</ul>
						<i className="bi bi-list mobile-nav-toggle" />
					</nav>
					{/* .navbar */}
				</div>
			</header>
			{/* End Header */}
			{/* ======= Hero Section ======= */}
			<section
				id="hero"
				className="d-flex flex-column justify-content-center align-items-center"
			>
				<div
					className="container text-center text-md-left"
					data-aos="fade-up"
				>
					<h1>Welcome to Secrets</h1>
					<h2>Tell your story and earn from it</h2>
					<a href="#contact " className="btn-get-started scrollto">
						Get Started
					</a>
				</div>
			</section>
			{/* End Hero */}
			<main id="main">
				{/* ======= Steps Section ======= */}
				<section id="steps" className="steps section-bg">
					<div className="container">
						<div className="row no-gutters">
							{secrets.map((secret) => (
								<div
									className="col-lg-4 col-md-6 content-item"
									data-aos="fade-in"
								>
									<span>{secret.index}</span>
									<p>{secret.secretText}</p>
									<br />
									<div className="d-flex justify-content-between">
										<div>
											<i
												onClick={() =>
													likeSecret(secret.index)
												}
												className="bi bi-hand-thumbs-up"
											></i>
											{secret.likes}
										</div>
										<div>
											<i
												onClick={() =>
													dislikeSecret(secret.index)
												}
												class="bi bi-hand-thumbs-down"
											></i>
											{secret.dislikes}
										</div>
									</div>
									<div className="form-group mt-3">
										<input
											type="text"
											className="form-control"
											name="amount"
											id="amount"
											placeholder="Amount"
											onChange={(e) =>
												setAmount(e.target.value)
											}
											required
										/>
									</div>
									<button
										className="btn btn-success mt-2"
										onClick={() =>
											giftAmount(secret.index, amount)
										}
									>
										Gift
									</button>
								</div>
							))}
						</div>
					</div>
				</section>
				{/* End Steps Section */}

				{/* ======= Contact Section ======= */}
				{address && contract ? (
					<section id="contact" className="contact">
						<div className="container">
							<div className="section-title" data-aos="fade-up">
								<h2>Add Your Secret </h2>
								<p>Add your secret to the pool</p>
							</div>
							<div
								className="row mt-5 justify-content-center"
								data-aos="fade-up"
							>
								<div className="col-lg-10">
									<form
										onSubmit={submitForm}
										className="php-email-form"
									>
										<div className="form-group mt-3">
											<textarea
												className="form-control"
												onChange={(e) =>
													setText(e.target.value)
												}
												name="message"
												rows={5}
												placeholder="Secrets..."
												required
												defaultValue={""}
											/>
										</div>
										<div className="text-center">
											<button type="submit">
												Start Here
											</button>
										</div>
									</form>
								</div>
							</div>
						</div>
					</section>
				) : (
					""
				)}
				{/* End Contact Section */}
			</main>
			{/* End #main */}
		</div>
	);
}

export default App;

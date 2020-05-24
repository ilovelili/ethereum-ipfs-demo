import React, { Component } from "react";
import "./App.css";
import Meme from "../abis/Meme.json";
const Web3 = require("web3");

const IpfsHttpClient = require("ipfs-http-client");
const ipfs = IpfsHttpClient({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

class App extends Component {
	async componentWillMount() {
		await this.loadWeb3();
		await this.loadBlockchainData();
	}

	constructor(props) {
		super(props);
		this.state = { account: "", buffer: null, memeHash: "QmaT2j5kPHMW6TVJ5JdieLqk6paLwgLcmuxxz9jtxCUbso", contract: null };
	}

	async loadWeb3() {
		if (window.ethereum) {
			// new Web3(new Web3.providers.HttpProvider(ganacheUrl));
			window.web3 = new Web3(window.ethereum);
			await window.ethereum.enable;
		} else if (window.web3) {
			window.web3 = new Web3(window.web3.currentProvider);
		} else {
			const localhost = "http://127.0.0.1:7545";
			window.web3 = new Web3(new Web3.providers.HttpProvider(localhost));
		}
	}

	// get the account
	async loadBlockchainData() {
		let accounts = await window.web3.eth.getAccounts();
		if (accounts.length) {
			this.setState({ account: accounts[0] });
		} else {
			window.alert("no account!");
		}

		let networkId = await window.web3.eth.net.getId();
		const networkData = Meme.networks[networkId];
		if (networkData) {
			const abi = Meme.abi;
			const address = networkData.address;
			const contract = new window.web3.eth.Contract(abi, address);
			this.setState({ contract: contract });
			// call 'get' method in smart contract
			const memeHash = await contract.methods.get().call();
			this.setState({ memeHash: memeHash });
		} else {
			window.alert("Smart contract not deployed to the nerwork");
		}
	}

	captureFile = (event) => {
		event.preventDefault();
		const file = event.target.files[0];
		// convert file to buffer
		const reader = new window.FileReader();
		reader.readAsArrayBuffer(file);
		reader.onloadend = () => {
			// setState is react method
			this.setState({ buffer: Buffer(reader.result) });
		};
	};

	onSubmit = async (event) => {
		event.preventDefault();
		for await (const result of ipfs.add(this.state.buffer)) {
			const memeHash = result.path;
			this.state.contract.methods
				.set(memeHash)
				.send({ from: this.state.account })
				.then((_) => {
					this.setState({ memeHash: memeHash });
				});
		}
	};

	render() {
		return (
			<div>
				<nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
					<a
						className="navbar-brand col-sm-3 col-md-2 mr-0"
						href="http://www.dappuniversity.com/bootcamp"
						target="_blank"
						rel="noopener noreferrer"
					>
						Meme Of The Day
					</a>
					<ul className="navbar-nav px-3">
						<li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
							<small className="text-white">{this.state.account}</small>
						</li>
					</ul>
				</nav>
				<div className="container-fluid mt-5">
					<div className="row">
						<main role="main" className="col-lg-12 d-flex text-center">
							<div className="content mr-auto ml-auto">
								<a href="http://www.dappuniversity.com/bootcamp" target="_blank" rel="noopener noreferrer">
									<img style={{ maxWidth: "300px" }} src={`https://ipfs.infura.io/ipfs/${this.state.memeHash}`} alt="meme" />
								</a>

								<p>&nbsp;</p>
								<h2>Change Meme</h2>
								<form onSubmit={this.onSubmit}>
									<input type="file" onChange={this.captureFile} />
									<input type="submit" />
								</form>
							</div>
						</main>
					</div>
				</div>
			</div>
		);
	}
}

export default App;

class WalletConnector {
    constructor() {
        this.provider = null;
        this.accounts = [];
        this.chainId = null;
        this.isConnected = false;
    }

    async initialize() {
        if (typeof WalletConnectProvider === 'undefined') {
            console.error("WalletConnectProvider not found. Make sure scripts are loaded correctly.");
            return false;
        }

        // Only include Taiko Alethia chain
        this.provider = new WalletConnectProvider({
            rpc: {
                167000: "https://rpc.ankr.com/taiko" // Taiko Alethia
            }
        });

        this.subscribeToEvents();
        return true;
    }

    async connect() {
        try {
            if (!this.provider) {
                const initialized = await this.initialize();
                if (!initialized) {
                    return { success: false, error: "Failed to initialize wallet connection" };
                }
            }

            const accounts = await this.provider.enable();

            this.accounts = accounts;
            this.chainId = this.provider.chainId;
            this.isConnected = true;

            return {
                success: true,
                address: accounts[0],
                chainId: this.chainId
            };
        } catch (error) {
            console.error("Error connecting wallet:", error);
            return {
                success: false,
                error: error.message || "Failed to connect wallet"
            };
        }
    }

    subscribeToEvents() {
        if (!this.provider) return;

        this.provider.on("accountsChanged", (accounts) => {
            this.accounts = accounts;
            if (accounts.length === 0) {
                this.isConnected = false;
                window.dispatchEvent(new CustomEvent('wallet_disconnected'));
            } else {
                window.dispatchEvent(new CustomEvent('wallet_account_changed', {
                    detail: { accounts }
                }));
            }
        });

        this.provider.on("chainChanged", (chainId) => {
            this.chainId = chainId;
            window.dispatchEvent(new CustomEvent('wallet_chain_changed', {
                detail: { chainId }
            }));
        });

        this.provider.on("disconnect", () => {
            this.isConnected = false;
            this.accounts = [];
            this.chainId = null;
            window.dispatchEvent(new CustomEvent('wallet_disconnected'));
        });
    }

    getWalletInfo() {
        return {
            isConnected: this.isConnected,
            address: this.accounts[0] || null,
            chainId: this.chainId
        };
    }
}

// Create and export a singleton instance
const walletConnector = new WalletConnector();
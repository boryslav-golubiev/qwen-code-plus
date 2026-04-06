#!/bin/bash
# Qwen Code Plus Installation Script
# Supports Linux and macOS
# Usage: curl -fsSL https://raw.githubusercontent.com/boryslav-golubiev/qwen-code-plus/refs/heads/main/scripts/installation/install-qwen-plus.sh | bash

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

get_shell_profile() {
    case "$(basename "${SHELL}")" in
        bash) echo "${HOME}/.bashrc" ;;
        zsh)  echo "${HOME}/.zshrc" ;;
        fish) echo "" ;;
        *)    echo "${HOME}/.profile" ;;
    esac
}

# ---- Check / Install Node.js ----
check_node() {
    if command_exists node; then
        local major
        major=$(node -v | sed 's/v//' | cut -d. -f1)
        if [ "$major" -ge 20 ]; then
            log_success "Node.js $(node -v) is already installed (>= 20)"
            return 0
        fi
    fi
    return 1
}

install_nvm() {
    local NVM_DIR="${NVM_DIR:-${HOME}/.nvm}"
    if [[ -s "${NVM_DIR}/nvm.sh" ]]; then
        log_info "NVM is already installed at ${NVM_DIR}"
        return 0
    fi
    log_info "Installing NVM..."
    local NVM_INSTALL_TEMP
    NVM_INSTALL_TEMP=$(mktemp)
    if curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh" > "${NVM_INSTALL_TEMP}"; then
        . "${NVM_INSTALL_TEMP}"
        rm -f "${NVM_INSTALL_TEMP}"
        log_success "NVM installed"
    else
        rm -f "${NVM_INSTALL_TEMP}"
        log_error "Failed to install NVM. Please install manually: https://github.com/nvm-sh/nvm"
        exit 1
    fi
    export NVM_DIR="${NVM_DIR}"
    [[ -s "${NVM_DIR}/nvm.sh" ]] && \. "${NVM_DIR}/nvm.sh"
}

install_node_via_nvm() {
    log_info "Installing Node.js 20 via NVM..."
    install_nvm
    export NVM_NODEJS_ORG_MIRROR="https://nodejs.org/dist"
    nvm install 20
    nvm alias default 20
    nvm use default
    log_success "Node.js $(node -v) installed"
}

# ---- Fix npm permissions ----
fix_npm_permissions() {
    local NPM_GLOBAL_DIR
    NPM_GLOBAL_DIR=$(npm config get prefix 2>/dev/null) || true
    local use_user_dir=false

    if [[ -z "${NPM_GLOBAL_DIR}" ]] || [[ "${NPM_GLOBAL_DIR}" == *"error"* ]]; then
        use_user_dir=true
    else
        case "${NPM_GLOBAL_DIR}" in
            /|/usr|/usr/local|/bin|/sbin|/lib) use_user_dir=true ;;
        esac
    fi

    if [[ "${use_user_dir}" == false ]] && [[ ! -w "${NPM_GLOBAL_DIR}" ]]; then
        use_user_dir=true
    fi

    if [[ "${use_user_dir}" == true ]]; then
        NPM_GLOBAL_DIR="${HOME}/.npm-global"
        mkdir -p "${NPM_GLOBAL_DIR}"
        npm config set prefix "${NPM_GLOBAL_DIR}"
        log_success "npm prefix set to: ${NPM_GLOBAL_DIR}"

        local PROFILE_FILE
        PROFILE_FILE=$(get_shell_profile)
        if [[ -n "${PROFILE_FILE}" ]] && ! grep -q '.npm-global/bin' "${PROFILE_FILE}" 2>/dev/null; then
            echo "" >> "${PROFILE_FILE}"
            echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> "${PROFILE_FILE}"
            log_info "Added npm bin to PATH in ${PROFILE_FILE}"
        fi
    fi
}

# ---- Main ----
main() {
    echo "=========================================="
    echo "   Qwen Code Plus Installer"
    echo "=========================================="
    echo ""

    if ! check_node; then
        log_warning "Node.js >= 20 required. Installing..."
        install_node_via_nvm
    fi

    log_info "Installing Qwen Code Plus globally..."
    fix_npm_permissions

    local NPM_GLOBAL_BIN
    NPM_GLOBAL_BIN=$(npm config get prefix 2>/dev/null)/bin
    if [[ -n "${NPM_GLOBAL_BIN}" ]]; then
        export PATH="${NPM_GLOBAL_BIN}:${PATH}"
    fi

    if npm install -g @boryslav-golubiev/qwen-code-plus@latest; then
        log_success "Qwen Code Plus installed successfully!"
        if command_exists qwen-plus; then
            log_success "Qwen Code Plus $(qwen-plus --version) is ready to use!"
            echo ""
            echo "Run: qwen-plus"
        else
            log_warning "qwen-plus not in PATH. Restart your terminal or run:"
            echo "  export PATH=\"$(npm config get prefix)/bin:\$PATH\""
        fi
    else
        log_error "Installation failed. Check your internet connection and try again."
        exit 1
    fi
}

main "$@"

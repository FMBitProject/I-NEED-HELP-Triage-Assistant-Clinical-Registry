{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];
  idx.extensions = [
    "esbenp.prettier-vscode"
    "bradlc.vscode-tailwindcss"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
  idx.workspace = {
    # Aktifkan WebSocket untuk HMR Next.js
    onStart = {
      install = "npm install";
    };
  };
  env = {
    # Nonaktifkan host check strict agar WebSocket HMR bisa lewat proxy IDX
    NEXT_PRIVATE_ALLOW_ALL_HOSTS = "1";
  };
}

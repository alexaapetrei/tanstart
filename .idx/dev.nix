{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
 pkgs.biome
  ];
  idx.extensions = [ 
    "vscode.typescript-language-features"
    "biomejs.biome"
    "vscode.tsx"
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
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}
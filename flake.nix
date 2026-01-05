{
  description = "Theia Framework Development Environment";

  inputs = { nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable"; };

  outputs = { self, nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default =
        (pkgs.mkShell.override { stdenv = pkgs.clangStdenv; }) {
          packages = with pkgs; [
            cmake
            clang-tools
            electron_38
            ffmpeg
            git
            libsecret
            libx11
            libxkbfile
            ninja
            nodejs_22
            pkg-config
            python3
            (pnpm.override { withNode = false; })
          ];

          shellHook = ''
            export CC=clang
            export CXX=clang++
          '';
        };
    };
}

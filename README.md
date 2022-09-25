# ERC20 - Fungible Token

## Setup

1. Clonar el repositorio

2. Complete sus datos:
  * NUMERO DE ESTUDIANTE:
  * NOMBRE DE ESTUDIANTE:
  * ADDRESS DE SU CUENTA:
  * ADDRESS DEL CONTRATO:

3. Installar hardhat `npm install hardhat --save-dev`

4. Instalar dependencias `npm install`

5. Complete la información del archivo `.env` en el directorio raiz de la carpeta. Si no utilizará Ganache para sus pruebas quitelo de la configuración.

6. Configure el archivo `hardhat.config.js` según sus necesidades

## Task

Se debe implementar los métodos del contrato `ERC20.sol` ubicado en la carpeta `contracts`. La implementación de cada método deberá cumplir con la descripción asociada, respetando los requerimientos en caso de que se indiquen. Se puede hacer uso de funciones auxiliares pero **deben** ser de visibilidad `private` y/o, en caso de que lo considere, hacer uso de `modifier`.

Utilice para todos sus comentarios la nomenclatura definida por ´Ethereum Natural Language Specification Format´ (´natspec´). Referencia: https://docs.soliditylang.org/en/v0.8.16/natspec-format.html

Complete el script de deploy `deploy.js` ubicado en la carpeta 'scripts' y deploye el contrato a Rinkeby.
Complete el script de test `erc20.test.js` ubicado en la carpeta 'test'.

Ejecute sus teste con el comando: `npx hardhat test`.

## **IMPORTANTE** Suba sus cambios al repositorio

1. Publicar cambios a su repositorio

`git add .`  
`git commit -m "<<your comments here>>"`  
`git push origin main`
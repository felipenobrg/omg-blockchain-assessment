const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AssessmentToken', () => {
  let token;
  let owner, alice, bob;
  const initialSupply = 1000;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const AssessmentToken = await ethers.getContractFactory('AssessmentToken');
    token = await AssessmentToken.deploy(initialSupply);
    await token.waitForDeployment();
  });

  it('mints the initial supply to the deployer', async () => {
    const decimals = await token.decimals();
    const expectedSupply = BigInt(initialSupply) * 10n ** decimals;

    expect(await token.totalSupply()).to.equal(expectedSupply);
    expect(await token.balanceOf(owner.address)).to.equal(expectedSupply);
  });

  it('transfers tokens between accounts and emits Transfer', async () => {
    await expect(token.transfer(alice.address, 100))
      .to.emit(token, 'Transfer')
      .withArgs(owner.address, alice.address, 100);

    expect(await token.balanceOf(alice.address)).to.equal(100);
  });

  it('reverts transfer when balance is insufficient', async () => {
    await expect(token.connect(alice).transfer(bob.address, 1)).to.be.revertedWith('insufficient balance');
  });

  it('approves an allowance and emits Approval', async () => {
    await expect(token.approve(alice.address, 50))
      .to.emit(token, 'Approval')
      .withArgs(owner.address, alice.address, 50);

    expect(await token.allowance(owner.address, alice.address)).to.equal(50);
  });

  it('transfers via transferFrom when allowance is sufficient', async () => {
    await token.approve(alice.address, 50);

    await expect(token.connect(alice).transferFrom(owner.address, bob.address, 30))
      .to.emit(token, 'Transfer')
      .withArgs(owner.address, bob.address, 30);

    expect(await token.balanceOf(bob.address)).to.equal(30);
    expect(await token.allowance(owner.address, alice.address)).to.equal(20);
  });

  it('reverts transferFrom when allowance is exceeded', async () => {
    await token.approve(alice.address, 10);

    await expect(
      token.connect(alice).transferFrom(owner.address, bob.address, 11)
    ).to.be.revertedWith('allowance exceeded');
  });

  it('reverts transferFrom when sender balance is insufficient', async () => {
    await token.transfer(alice.address, 5);
    await token.connect(alice).approve(bob.address, 100);

    await expect(
      token.connect(bob).transferFrom(alice.address, owner.address, 6)
    ).to.be.revertedWith('insufficient balance');
  });

  it('reverts transfer to the zero address', async () => {
    await expect(
      token.transfer(ethers.ZeroAddress, 1)
    ).to.be.revertedWith('transfer to zero address');
  });

  it('reverts approve to the zero address', async () => {
    await expect(
      token.approve(ethers.ZeroAddress, 1)
    ).to.be.revertedWith('approve to zero address');
  });

  it('reverts transferFrom to the zero address', async () => {
    await token.approve(alice.address, 10);

    await expect(
      token.connect(alice).transferFrom(owner.address, ethers.ZeroAddress, 1)
    ).to.be.revertedWith('transfer to zero address');
  });

  it('burns tokens from the caller balance and reduces total supply', async () => {
    const supplyBefore = await token.totalSupply();

    await expect(token.burn(100))
      .to.emit(token, 'Transfer')
      .withArgs(owner.address, ethers.ZeroAddress, 100);

    expect(await token.balanceOf(owner.address)).to.equal(supplyBefore - 100n);
    expect(await token.totalSupply()).to.equal(supplyBefore - 100n);
  });

  it('reverts burn when balance is insufficient', async () => {
    await expect(token.connect(alice).burn(1)).to.be.revertedWith('insufficient balance');
  });
});

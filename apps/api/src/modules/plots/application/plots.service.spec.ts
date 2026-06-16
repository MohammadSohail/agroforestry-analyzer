import { InMemoryPlotRepository } from '../../../../test/fakes/in-memory-plot.repository';
import { ResourceNotFoundException } from '../../../common/exceptions/domain.exception';
import { PlotsService } from './plots.service';

describe('PlotsService', () => {
  let repo: InMemoryPlotRepository;
  let service: PlotsService;

  beforeEach(() => {
    repo = new InMemoryPlotRepository();
    service = new PlotsService(repo);
  });

  const sample = { name: 'Block A', latitude: -0.78, longitude: 35.34 };

  it('creates and reads back a plot', async () => {
    const created = await service.create(sample);
    expect(created.id).toBeDefined();
    const fetched = await service.getOrThrow(created.id);
    expect(fetched.name).toBe('Block A');
  });

  it('throws ResourceNotFoundException for a missing plot', async () => {
    await expect(service.getOrThrow('missing')).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('paginates listing', async () => {
    await service.create(sample);
    await service.create({ ...sample, name: 'Block B' });
    const { items, total } = await service.list(0, 1);
    expect(total).toBe(2);
    expect(items).toHaveLength(1);
  });

  it('updates and deletes', async () => {
    const created = await service.create(sample);
    const updated = await service.update(created.id, { name: 'Renamed' });
    expect(updated.name).toBe('Renamed');
    await service.remove(created.id);
    await expect(service.getOrThrow(created.id)).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects update/delete of a missing plot', async () => {
    await expect(service.update('missing', { name: 'x' })).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    await expect(service.remove('missing')).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

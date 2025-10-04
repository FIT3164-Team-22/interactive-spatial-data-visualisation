import { renderHook } from '@testing-library/react'
import { FilterProvider, useFilters } from '../FilterContext'
import { DATE_BOUNDS } from '../../config'

describe('FilterContext', () => {
  it('provides default filter values', () => {
    const { result } = renderHook(() => useFilters(), { wrapper: FilterProvider })
    expect(result.current.startDate).toBe(DATE_BOUNDS.min)
    expect(result.current.endDate).toBe(DATE_BOUNDS.max)
    expect(result.current.selectedMetric).toBe('temperature')
    expect(result.current.showHeatmap).toBe(true)
  })
})

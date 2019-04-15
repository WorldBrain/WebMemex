import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import RootState, { MapDispatchToProps } from 'src/sidebar-overlay/types'
import ListSideBar from './lists-container'
import {
    BookmarkFilter,
    TagsFilter,
    DomainsFilter,
    DatesFilter,
    ContentTypeContainer,
} from 'src/search-filters/components'
import { ButtonTooltip } from 'src/common-ui/components/'
import { actions as filterActs } from 'src/search-filters'
import {
    acts as searchBarActs,
    selectors as searchBar,
} from 'src/overview/search-bar'

import cx from 'classnames'

const styles = require('./filters-sidebar.css')

interface StateProps {
    showClearFiltersBtn: boolean
}

interface DispatchProps {
    clearAllFilters: React.MouseEventHandler<HTMLButtonElement>
    fetchSuggestedTags: () => void
    fetchSuggestedDomains: () => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    toggleShowFilters: () => void
}

type Props = StateProps & DispatchProps & OwnProps

class FiltersSidebar extends Component<Props> {
    componentDidMount() {
        this.props.fetchSuggestedTags()
        this.props.fetchSuggestedDomains()
    }

    render() {
        return (
            <div
                className={cx(styles.filtersSidebar, {
                    [styles.filtersSidebarOverview]:
                        this.props.env === 'overview',
                })}
            >
                <div className={styles.filtersDiv}>
                    <div className={styles.filtersNav}>
                        <span>Filters</span>
                        {this.props.showClearFiltersBtn && (
                            <ButtonTooltip
                                position="right"
                                tooltipText={'Clear filters'}
                            >
                                <span
                                    className={styles.clearFilters}
                                    onClick={this.props.clearAllFilters}
                                />
                            </ButtonTooltip>
                        )}
                        <ButtonTooltip
                            tooltipText={'Close filters sidebar'}
                            position="right"
                        >
                            <button
                                className={styles.arrow}
                                onClick={this.props.toggleShowFilters}
                            />
                        </ButtonTooltip>
                    </div>
                    <div className={styles.filters}>
                        <div className={styles.filterDiv}>
                            <BookmarkFilter />
                        </div>
                        <div className={styles.filterDiv}>
                            <DatesFilter
                                tooltipPosition="inpage"
                                env="inpage"
                            />
                        </div>
                        <div className={styles.filterDiv}>
                            <TagsFilter tooltipPosition="inpage" env="inpage" />
                        </div>
                        <div className={styles.filterDiv}>
                            <DomainsFilter
                                tooltipPosition="inpage"
                                env="inpage"
                            />
                        </div>
                        <div className={styles.filterDiv}>
                            <ContentTypeContainer
                                tooltipPosition="inpage"
                                env="inpage"
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.listsDiv}>
                    <ListSideBar />
                </div>
            </div>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    showClearFiltersBtn: searchBar.showClearFiltersBtn(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    clearAllFilters: e => {
        e.preventDefault()
        dispatch(filterActs.resetFilters())
        dispatch(searchBarActs.clearFilters())
    },
    fetchSuggestedTags: () => dispatch(filterActs.fetchSuggestedTags()),
    fetchSuggestedDomains: () => dispatch(filterActs.fetchSuggestedDomains()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(FiltersSidebar)
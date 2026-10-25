import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('everyday_source', pathlib.Path(__file__).with_name('build-everyday-places.py'))
source = importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)

class LifecycleTest(unittest.TestCase):
    def test_explicit_unavailability_is_never_a_candidate(self):
        for patch in [{'closed':'yes'}, {'opening_hours':'closed'}, {'access':'private'}, {'access':'no'}, {'disused':'yes'}, {'abandoned:amenity':'restaurant'}]:
            with self.subTest(patch=patch):
                self.assertIsNone(source.classify({'amenity':'restaurant', **patch}))

    def test_no_invented_opening_or_customer_demand(self):
        self.assertEqual(source.classify({'amenity':'cafe'}), ('food','cafe'))
        self.assertIsNone(source.classify({'amenity':'school'}))

if __name__ == '__main__': unittest.main()
